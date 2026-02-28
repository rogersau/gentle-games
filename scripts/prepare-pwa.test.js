describe('prepare-pwa cache busting helpers', () => {
  const originalSha = process.env.GITHUB_SHA;

  afterEach(() => {
    if (originalSha === undefined) {
      delete process.env.GITHUB_SHA;
    } else {
      process.env.GITHUB_SHA = originalSha;
    }
    jest.resetModules();
  });

  it('uses GITHUB_SHA for cache/version tags', () => {
    process.env.GITHUB_SHA = 'abc123';
    const pwa = require('./prepare-pwa');

    expect(pwa.getCacheName()).toBe('gentle-games-abc123');
    expect(pwa.getManifestTag()).toBe('./manifest.webmanifest?v=abc123');
    expect(pwa.getServiceWorkerTag()).toBe('./sw.js?v=abc123');
  });

  it('falls back to timestamp-based version when GITHUB_SHA is missing', () => {
    delete process.env.GITHUB_SHA;
    const pwa = require('./prepare-pwa');

    expect(pwa.getCacheName()).toMatch(/^gentle-games-\d+$/);
    expect(pwa.getManifestTag()).toMatch(/^\.\/manifest\.webmanifest\?v=\d+$/);
    expect(pwa.getServiceWorkerTag()).toMatch(/^\.\/sw\.js\?v=\d+$/);
  });
});
