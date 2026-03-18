const mockExecSync = jest.fn();
const mockExistsSync = jest.fn();
const mockReadFileSync = jest.fn();
const mockReaddirSync = jest.fn();
const mockJoin = jest.fn((...parts) => parts.join('/'));

jest.mock('child_process', () => ({
  execSync: mockExecSync,
}));

jest.mock('fs', () => ({
  existsSync: mockExistsSync,
  readFileSync: mockReadFileSync,
  readdirSync: mockReaddirSync,
}));

jest.mock('path', () => ({
  join: mockJoin,
}));

const makeDirent = (name, isDirectory) => ({
  name,
  isDirectory: () => isDirectory,
});

describe('upload-sourcemaps', () => {
  const originalEnv = process.env;
  const originalExit = process.exit;
  let exitSpy;
  let logSpy;
  let warnSpy;
  let errorSpy;

  const projectRoot = `${__dirname}/..`;
  const distRoot = `${projectRoot}/dist`;
  const androidRoot = `${distRoot}/android`;
  const iosRoot = `${distRoot}/ios`;
  const webAssetsRoot = `${distRoot}/_expo/static/js/web`;
  const androidAssetsRoot = `${androidRoot}/_expo/static/js/android`;
  const iosAssetsRoot = `${iosRoot}/_expo/static/js/ios`;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    process.env = {
      ...originalEnv,
      SENTRY_AUTH_TOKEN: 'token',
      SENTRY_ORG: 'org',
      SENTRY_PROJECT: 'project',
    };

    exitSpy = jest.fn();
    process.exit = exitSpy;

    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    mockReadFileSync.mockReturnValue(JSON.stringify({ version: '1.1.0' }));
    mockExistsSync.mockImplementation((targetPath) =>
      [
        distRoot,
        `${distRoot}/_expo`,
        `${distRoot}/_expo/static`,
        `${distRoot}/_expo/static/js`,
        androidRoot,
        `${androidRoot}/_expo`,
        `${androidRoot}/_expo/static`,
        `${androidRoot}/_expo/static/js`,
        iosRoot,
        `${iosRoot}/_expo`,
        `${iosRoot}/_expo/static`,
        `${iosRoot}/_expo/static/js`,
        webAssetsRoot,
        androidAssetsRoot,
        iosAssetsRoot,
      ].includes(targetPath)
    );
    mockReaddirSync.mockImplementation((targetPath) => {
      if (targetPath === distRoot) {
        return [
          makeDirent('_expo', true),
          makeDirent('android', true),
          makeDirent('ios', true),
        ];
      }

      if (targetPath === `${distRoot}/_expo`) {
        return [makeDirent('static', true)];
      }

      if (targetPath === `${distRoot}/_expo/static`) {
        return [makeDirent('js', true)];
      }

      if (targetPath === `${distRoot}/_expo/static/js`) {
        return [makeDirent('web', true)];
      }

      if (targetPath === webAssetsRoot) {
        return [makeDirent('index.web.map', false)];
      }

      if (targetPath === androidRoot) {
        return [makeDirent('_expo', true)];
      }

      if (targetPath === `${androidRoot}/_expo`) {
        return [makeDirent('static', true)];
      }

      if (targetPath === `${androidRoot}/_expo/static`) {
        return [makeDirent('js', true)];
      }

      if (targetPath === `${androidRoot}/_expo/static/js`) {
        return [makeDirent('android', true)];
      }

      if (targetPath === androidAssetsRoot) {
        return [makeDirent('index.android.map', false)];
      }

      if (targetPath === iosRoot) {
        return [makeDirent('_expo', true)];
      }

      if (targetPath === `${iosRoot}/_expo`) {
        return [makeDirent('static', true)];
      }

      if (targetPath === `${iosRoot}/_expo/static`) {
        return [makeDirent('js', true)];
      }

      if (targetPath === `${iosRoot}/_expo/static/js`) {
        return [makeDirent('ios', true)];
      }

      if (targetPath === iosAssetsRoot) {
        return [makeDirent('index.ios.map', false)];
      }

      return [];
    });
  });

  afterEach(() => {
    process.env = originalEnv;
    process.exit = originalExit;
    logSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('imports without running uploads and exposes platform helpers', () => {
    const uploadScript = require('./upload-sourcemaps');

    expect(mockExecSync).not.toHaveBeenCalled();
    expect(uploadScript.uploadSourceMaps).toEqual(expect.any(Function));
    expect(uploadScript.findSourceMaps).toEqual(expect.any(Function));
    expect(uploadScript.getPlatformDistDir).toEqual(expect.any(Function));
  });

  it('maps web to dist root while keeping native platform directories explicit', () => {
    const { getPlatformDistDir } = require('./upload-sourcemaps');

    expect(getPlatformDistDir('web')).toBe(distRoot);
    expect(getPlatformDistDir('android')).toBe(androidRoot);
    expect(getPlatformDistDir('ios')).toBe(iosRoot);
  });

  it('does not count native artifacts when scanning the web export root', () => {
    const { uploadSourceMaps } = require('./upload-sourcemaps');

    uploadSourceMaps();

    expect(mockExecSync).toHaveBeenCalledTimes(3);
    expect(mockExecSync).toHaveBeenCalledWith(
      expect.stringContaining(`upload-sourcemaps ${distRoot} --url-prefix ~/web --rewrite`),
      { stdio: 'inherit' }
    );
    expect(logSpy).toHaveBeenCalledWith('\n✅ Successfully uploaded 3 source map(s) to Sentry!');
  });

  it('skips missing platform directories without failing the release path', () => {
    const { uploadSourceMaps } = require('./upload-sourcemaps');
    mockExistsSync.mockImplementation((targetPath) => targetPath === distRoot);
    mockReaddirSync.mockImplementation((targetPath) => {
      if (targetPath === distRoot) {
        return [];
      }

      return [];
    });

    uploadSourceMaps();

    expect(logSpy).toHaveBeenCalledWith('   ⏭️  Skipping android (no dist directory)');
    expect(logSpy).toHaveBeenCalledWith('   ⏭️  Skipping ios (no dist directory)');
    expect(warnSpy).toHaveBeenCalledWith('\n⚠️  No source maps were uploaded.');
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it('skips platforms that have no source maps in their resolved root', () => {
    const { uploadSourceMaps } = require('./upload-sourcemaps');
    mockReaddirSync.mockImplementation((targetPath) => {
      if (targetPath === distRoot) {
        return [makeDirent('_expo', true)];
      }

      if (targetPath === `${distRoot}/_expo`) {
        return [makeDirent('static', true)];
      }

      if (targetPath === `${distRoot}/_expo/static`) {
        return [makeDirent('js', true)];
      }

      if (targetPath === `${distRoot}/_expo/static/js`) {
        return [makeDirent('web', true)];
      }

      if (targetPath === webAssetsRoot) {
        return [makeDirent('index.web.js', false)];
      }

      return [];
    });

    uploadSourceMaps();

    expect(logSpy).toHaveBeenCalledWith('   ⏭️  Skipping web (no source maps found)');
  });
});
