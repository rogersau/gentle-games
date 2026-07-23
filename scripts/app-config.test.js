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
  it.each(['build:web', 'build:android', 'build:ios'])(
    'emits source maps from %s',
    (scriptName) => {
      expect(packageJson.scripts[scriptName]).toContain('--source-maps');
    },
  );

  it.each(['azure-dev-deploy.yml', 'azure-prod-deploy.yml'])(
    'uploads and removes web source maps in %s',
    (workflowName) => {
      const workflow = fs.readFileSync(
        path.join(projectRoot, '.github', 'workflows', workflowName),
        'utf8',
      );
      expect(workflow).toContain('node scripts/upload-sourcemaps.js');
      expect(workflow).toContain("find dist -type f -name '*.map' -delete");
    },
  );
});

describe('test discovery', () => {
  it('does not execute tests from sibling worktrees', () => {
    expect(jestConfig.testPathIgnorePatterns).toContain('/.worktrees/');
  });
});
