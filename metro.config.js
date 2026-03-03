const { getDefaultConfig } = require('expo/metro-config');

/**
 * Metro configuration for Gentle Games.
 *
 * Enables source map generation for Sentry error reporting.
 */
module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  // Enable source map generation for all builds
  // Required for Sentry to show readable stack traces
  config.transformer.minifierConfig = {
    ...config.transformer.minifierConfig,
    // Preserve source maps through minification
    sourceMap: {
      includeSources: true,
    },
  };

  // Ensure source maps are generated for the bundle
  config.transformer.getTransformOptions = async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
      // Enable source maps in production
      sourceMap: true,
    },
  });

  return config;
})();
