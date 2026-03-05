const mockWriteFileSync = jest.fn();
const mockReadFileSync = jest.fn();
const mockExistsSync = jest.fn();
const mockMkdirSync = jest.fn();
const mockReaddirSync = jest.fn();
const mockCopyFileSync = jest.fn();
const mockJoin = jest.fn((...args) => args.join('/'));
const mockResolve = jest.fn((p) => p);

jest.mock('fs', () => ({
  writeFileSync: mockWriteFileSync,
  readFileSync: mockReadFileSync,
  existsSync: mockExistsSync,
  mkdirSync: mockMkdirSync,
  readdirSync: mockReaddirSync,
  copyFileSync: mockCopyFileSync,
}));

jest.mock('path', () => ({
  join: mockJoin,
  resolve: mockResolve,
}));

describe('prepare-pwa', () => {
  const originalSha = process.env.GITHUB_SHA;
  const originalCwd = process.cwd;
  let pwa;

  beforeEach(() => {
    // Clear mocks
    jest.clearAllMocks();
    jest.resetModules();

    // Mock process.cwd
    process.cwd = jest.fn().mockReturnValue('/project');

    // Setup default fs mocks - everything exists by default
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue('<html><head></head><body></body></html>');
    mockWriteFileSync.mockImplementation(() => {});
    mockMkdirSync.mockImplementation(() => {});
    mockReaddirSync.mockReturnValue([
      'icon-32x32.png',
      'icon-180x180.png',
      'icon-192x192.png',
      'icon-512x512.png',
      'icon-192x192-maskable.png',
      'icon-512x512-maskable.png',
    ]);
    mockCopyFileSync.mockImplementation(() => {});

    // Require module fresh for each test
    pwa = require('./prepare-pwa');
  });

  afterEach(() => {
    if (originalSha === undefined) {
      delete process.env.GITHUB_SHA;
    } else {
      process.env.GITHUB_SHA = originalSha;
    }
    process.cwd = originalCwd;
  });

  describe('cache busting helpers', () => {
    it('uses GITHUB_SHA for cache/version tags', () => {
      process.env.GITHUB_SHA = 'abc123';
      jest.resetModules();
      pwa = require('./prepare-pwa');

      expect(pwa.getCacheName()).toBe('gentle-games-abc123');
      expect(pwa.getManifestTag()).toBe('./manifest.webmanifest?v=abc123');
      expect(pwa.getServiceWorkerTag()).toBe('./sw.js?v=abc123');
    });

    it('falls back to timestamp-based version when GITHUB_SHA is missing', () => {
      delete process.env.GITHUB_SHA;
      jest.resetModules();
      pwa = require('./prepare-pwa');

      expect(pwa.getCacheName()).toMatch(/^gentle-games-\d+$/);
      expect(pwa.getManifestTag()).toMatch(/^\.\/manifest\.webmanifest\?v=\d+$/);
      expect(pwa.getServiceWorkerTag()).toMatch(/^\.\/sw\.js\?v=\d+$/);
    });
  });

  describe('writeManifest', () => {
    it('generates manifest.json with correct fields', () => {
      pwa.writeManifest();

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining('manifest.webmanifest'),
        expect.stringContaining('"name": "Gentle Games"')
      );

      const writtenContent = mockWriteFileSync.mock.calls[0][1];
      const manifest = JSON.parse(writtenContent);

      expect(manifest.name).toBe('Gentle Games');
      expect(manifest.short_name).toBe('Gentle Games');
      expect(manifest.start_url).toBe('./');
      expect(manifest.display).toBe('standalone');
      expect(manifest.background_color).toBe('#FFFEF7');
      expect(manifest.theme_color).toBe('#FFFEF7');
      expect(manifest.icons).toHaveLength(5);
    });

    it('includes maskable icons with purpose property', () => {
      pwa.writeManifest();

      const writtenContent = mockWriteFileSync.mock.calls[0][1];
      const manifest = JSON.parse(writtenContent);

      const maskableIcons = manifest.icons.filter((icon) => icon.purpose === 'maskable');
      expect(maskableIcons).toHaveLength(2);
    });
  });

  describe('writeServiceWorker', () => {
    it('generates service worker with cache name', () => {
      pwa.writeServiceWorker();

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining('sw.js'),
        expect.stringContaining('const CACHE_NAME')
      );
    });

    it('includes install event handler', () => {
      pwa.writeServiceWorker();

      const swContent = mockWriteFileSync.mock.calls[0][1];
      expect(swContent).toContain("self.addEventListener('install'");
      expect(swContent).toContain('skipWaiting');
    });

    it('includes activate event handler', () => {
      pwa.writeServiceWorker();

      const swContent = mockWriteFileSync.mock.calls[0][1];
      expect(swContent).toContain("self.addEventListener('activate'");
      expect(swContent).toContain('caches.delete');
    });

    it('includes fetch event handler for navigation requests', () => {
      pwa.writeServiceWorker();

      const swContent = mockWriteFileSync.mock.calls[0][1];
      expect(swContent).toContain("self.addEventListener('fetch'");
      expect(swContent).toContain("event.request.mode === 'navigate'");
      expect(swContent).toContain('caches.match');
    });

    it('includes cache entries for all required icons', () => {
      pwa.writeServiceWorker();

      const swContent = mockWriteFileSync.mock.calls[0][1];
      expect(swContent).toContain('./icons/icon-192x192.png');
      expect(swContent).toContain('./icons/icon-512x512.png');
    });
  });

  describe('patchIndexHtml', () => {
    it('adds manifest link when not present', () => {
      mockReadFileSync.mockReturnValue('<html><head></head><body></body></html>');

      pwa.patchIndexHtml();

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining('index.html'),
        expect.stringContaining('rel="manifest"')
      );
    });

    it('adds apple-touch-icon link', () => {
      mockReadFileSync.mockReturnValue('<html><head></head><body></body></html>');

      pwa.patchIndexHtml();

      const writtenContent = mockWriteFileSync.mock.calls[0][1];
      expect(writtenContent).toContain('rel="apple-touch-icon"');
      expect(writtenContent).toContain('./icons/icon-180x180.png');
    });

    it('adds favicon links', () => {
      mockReadFileSync.mockReturnValue('<html><head></head><body></body></html>');

      pwa.patchIndexHtml();

      const writtenContent = mockWriteFileSync.mock.calls[0][1];
      expect(writtenContent).toContain('rel="icon"');
      expect(writtenContent).toContain('./icons/icon-32x32.png');
    });

    it('adds service worker registration script', () => {
      mockReadFileSync.mockReturnValue('<html><head></head><body></body></html>');

      pwa.patchIndexHtml();

      const writtenContent = mockWriteFileSync.mock.calls[0][1];
      expect(writtenContent).toContain('serviceWorker.register');
      expect(writtenContent).toContain('navigator.serviceWorker');
    });

    it('updates existing manifest link with version', () => {
      mockReadFileSync.mockReturnValue('<html><head><link rel="manifest" href="manifest.webmanifest" /></head><body></body></html>');

      pwa.patchIndexHtml();

      const writtenContent = mockWriteFileSync.mock.calls[0][1];
      expect(writtenContent).toContain('manifest.webmanifest?v=');
    });

    it('updates existing service worker registration', () => {
      mockReadFileSync.mockReturnValue('<html><head></head><body><script>serviceWorker.register("sw.js")</script></body></html>');

      pwa.patchIndexHtml();

      const writtenContent = mockWriteFileSync.mock.calls[0][1];
      expect(writtenContent).toMatch(/serviceWorker\.register\('.*sw\.js\?v=.*'\)/);
    });

    it('preserves existing content when adding manifest', () => {
      mockReadFileSync.mockReturnValue('<html><head><title>Test</title></head><body><div>Content</div></body></html>');

      pwa.patchIndexHtml();

      const writtenContent = mockWriteFileSync.mock.calls[0][1];
      expect(writtenContent).toContain('<title>Test</title>');
      expect(writtenContent).toContain('<div>Content</div>');
    });
  });

  describe('run function', () => {
    let consoleLogSpy;

    beforeEach(() => {
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
    });

    it('throws when dist directory is missing', () => {
      mockExistsSync.mockImplementation((filePath) => {
        if (filePath.includes('dist') && !filePath.includes('index.html')) return false;
        return true;
      });

      expect(() => {
        pwa.run();
      }).toThrow('dist directory not found');
    });

    it('throws when index.html is missing', () => {
      mockExistsSync.mockImplementation((filePath) => {
        if (filePath.includes('index.html')) return false;
        return true;
      });

      expect(() => {
        pwa.run();
      }).toThrow('dist index.html not found');
    });

    it('throws when PWA assets directory is missing', () => {
      mockExistsSync.mockImplementation((filePath) => {
        if (filePath.includes('pwa')) return false;
        return true;
      });

      expect(() => {
        pwa.run();
      }).toThrow('PWA assets directory not found');
    });

    it('throws when required PWA icon is missing', () => {
      mockExistsSync.mockImplementation((filePath) => {
        if (filePath.includes('icon-192x192.png')) return false;
        return true;
      });

      expect(() => {
        pwa.run();
      }).toThrow('PWA asset not found');
    });

    it('creates icons output directory', () => {
      pwa.run();

      expect(mockMkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('icons'),
        { recursive: true }
      );
    });

    it('copies all PNG files from PWA assets', () => {
      mockReaddirSync.mockReturnValue([
        'icon-32x32.png',
        'icon-180x180.png',
        'icon-192x192.png',
        'icon-512x512.png',
        'icon-192x192-maskable.png',
        'icon-512x512-maskable.png',
        'README.txt', // Non-PNG file should be skipped
      ]);

      pwa.run();

      expect(mockCopyFileSync).toHaveBeenCalledTimes(6);
    });

    it('outputs success message when complete', () => {
      pwa.run();

      expect(consoleLogSpy).toHaveBeenCalledWith('PWA assets prepared in dist/');
    });

    it('calls writeManifest during run', () => {
      pwa.run();

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining('manifest.webmanifest'),
        expect.any(String)
      );
    });

    it('calls writeServiceWorker during run', () => {
      pwa.run();

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining('sw.js'),
        expect.any(String)
      );
    });

    it('calls patchIndexHtml during run', () => {
      mockReadFileSync.mockReturnValue('<html><head></head><body></body></html>');

      pwa.run();

      expect(mockReadFileSync).toHaveBeenCalledWith(
        expect.stringContaining('index.html'),
        'utf8'
      );
    });
  });
});
