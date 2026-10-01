const { getSentryExpoConfig } = require('@sentry/react-native/metro');

const config = getSentryExpoConfig(__dirname, {
  includeWebReplay: false,
  includeWebFeedback: false,
  autoWrapExpoRouterErrorBoundary: false
});

config.resolver.assetExts = Array.from(new Set([
  ...config.resolver.assetExts,
  'glb',
  'gltf',
  'vrx',
  'obj',
  'mtl'
]));

module.exports = config;
