const fs = require('fs');
const path = require('path');
const appConfig = require('../app.config');
const packageJson = require('../package.json');
const jestConfig = require('../jest.config');

const projectRoot = path.join(__dirname, '..');

describe('native app configuration', () => {
  it.each([
    ['application icon', appConfig.icon],
    ['Android adaptive icon', appConfig.android.adaptiveIcon.foregroundImage],
  ])('references an existing %s', (_label, assetPath) => {
    expect(fs.existsSync(path.resolve(projectRoot, assetPath))).toBe(true);
  });
});

describe('release builds', () => {
  it('keeps the Sentry auth token out of public Expo plugin configuration', () => {
    const sentryPlugin = appConfig.plugins.find(
      (plugin) => Array.isArray(plugin) && plugin[0] === '@sentry/react-native/expo',
    );

    expect(sentryPlugin).toBeDefined();
    expect(sentryPlugin[1]).not.toHaveProperty('authToken');
  });

  it.each(['build:web', 'build:android', 'build:ios'])(
    'emits source maps from %s',
    (scriptName) => {
      expect(packageJson.scripts[scriptName]).toContain('--source-maps');
    },
  );

  it('builds the production PWA at the domain root and strips uploaded source maps', () => {
    const workflow = fs.readFileSync(
      path.join(projectRoot, '.github', 'workflows', 'azure-prod-deploy.yml'),
      'utf8',
    );
    expect(appConfig.experiments.baseUrl).toBe(process.env.EXPO_BASE_URL ?? '');
    expect(workflow).toContain('npm run build:pwa');
    expect(workflow).toContain('node scripts/upload-sourcemaps.js');
    expect(workflow).toContain("find dist -type f -name '*.map' -delete");
  });
});

describe('test discovery', () => {
  it('does not execute tests from sibling worktrees', () => {
    expect(jestConfig.testPathIgnorePatterns).toContain('/.worktrees/');
  });
});
