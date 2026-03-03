#!/usr/bin/env node

/**
 * Source map upload script for Sentry.
 *
 * Usage:
 *   node scripts/upload-sourcemaps.js
 *
 * Required environment variables:
 *   - SENTRY_AUTH_TOKEN
 *   - SENTRY_ORG
 *   - SENTRY_PROJECT
 *
 * This script uploads source maps to Sentry for readable stack traces.
 * Usually handled automatically by @sentry/react-native/expo plugin,
 * but available as fallback for custom build pipelines.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REQUIRED_ENV_VARS = ['SENTRY_AUTH_TOKEN', 'SENTRY_ORG', 'SENTRY_PROJECT'];

function checkEnvironment() {
  const missing = REQUIRED_ENV_VARS.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => console.error(`   - ${varName}`));
    console.error('\nSet these variables and try again.');
    process.exit(1);
  }
}

function getVersion() {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  return packageJson.version;
}

function findSourceMaps(distDir) {
  const sourceMaps = [];

  function searchDir(dir) {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        searchDir(fullPath);
      } else if (entry.name.endsWith('.map')) {
        sourceMaps.push(fullPath);
      }
    }
  }

  searchDir(distDir);
  return sourceMaps;
}

function uploadSourceMaps() {
  const { SENTRY_ORG, SENTRY_PROJECT, SENTRY_AUTH_TOKEN } = process.env;
  const version = getVersion();
  const release = `gentle-games@${version}`;

  console.log('🗺️  Uploading source maps to Sentry...');
  console.log(`   Organization: ${SENTRY_ORG}`);
  console.log(`   Project: ${SENTRY_PROJECT}`);
  console.log(`   Release: ${release}`);

  // Check for dist directories
  const platforms = ['web', 'ios', 'android'];
  let uploadedCount = 0;

  for (const platform of platforms) {
    const distDir = path.join(__dirname, '..', 'dist', platform);

    if (!fs.existsSync(distDir)) {
      console.log(`   ⏭️  Skipping ${platform} (no dist directory)`);
      continue;
    }

    const sourceMaps = findSourceMaps(distDir);

    if (sourceMaps.length === 0) {
      console.log(`   ⏭️  Skipping ${platform} (no source maps found)`);
      continue;
    }

    console.log(`   📁 Found ${sourceMaps.length} source map(s) for ${platform}`);

    try {
      // Upload source maps using sentry-cli
      const cmd = [
        'npx sentry-cli',
        `--auth-token ${SENTRY_AUTH_TOKEN}`,
        `--org ${SENTRY_ORG}`,
        `--project ${SENTRY_PROJECT}`,
        'releases',
        `files ${release}`,
        'upload-sourcemaps',
        distDir,
        '--url-prefix',
        `~/${platform}`,
        '--rewrite',
      ].join(' ');

      execSync(cmd, { stdio: 'inherit' });
      uploadedCount += sourceMaps.length;
      console.log(`   ✅ Uploaded source maps for ${platform}`);
    } catch (error) {
      console.error(`   ❌ Failed to upload source maps for ${platform}`);
      console.error(error.message);
      // Don't exit - try other platforms
    }
  }

  if (uploadedCount === 0) {
    console.warn('\n⚠️  No source maps were uploaded.');
    console.warn('   Run a build first: npm run build:web');
    process.exit(0);
  }

  console.log(`\n✅ Successfully uploaded ${uploadedCount} source map(s) to Sentry!`);
  console.log(`   Release: ${release}`);
}

// Main execution
console.log('🚀 Sentry Source Map Upload\n');
checkEnvironment();
uploadSourceMaps();
