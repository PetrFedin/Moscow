const staticConfig = require('./app.json').expo;

const SUPPORTED_ANCHOR_PROVIDERS = new Set(['none', 'reactvision', 'arcore']);

function requiredEnv(name, provider) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required for spatial anchor provider "${provider}"`);
  }
  return value;
}

module.exports = () => {
  const provider = (process.env.EXPO_PUBLIC_SPATIAL_ANCHOR_PROVIDER || 'none').trim().toLowerCase();
  if (!SUPPORTED_ANCHOR_PROVIDERS.has(provider)) {
    throw new Error(`Unsupported EXPO_PUBLIC_SPATIAL_ANCHOR_PROVIDER: ${provider}`);
  }

  const viroOptions = {
    provider,
    android: {
      xRMode: ['AR']
    }
  };

  if (provider === 'reactvision') {
    viroOptions.rvApiKey = requiredEnv('VIRO_RV_API_KEY', provider);
    viroOptions.rvProjectId = requiredEnv('VIRO_RV_PROJECT_ID', provider);
    if (process.env.VIRO_RV_ENDPOINT?.trim()) {
      viroOptions.rvEndpoint = process.env.VIRO_RV_ENDPOINT.trim();
    }
  }

  if (provider === 'arcore') {
    viroOptions.googleCloudApiKey = requiredEnv('VIRO_GOOGLE_CLOUD_API_KEY', provider);
  }

  const plugins = (staticConfig.plugins || []).map((plugin) => {
    if (Array.isArray(plugin) && plugin[0] === '@reactvision/react-viro') {
      return ['@reactvision/react-viro', viroOptions];
    }
    return plugin;
  });

  return {
    ...staticConfig,
    plugins,
    extra: {
      ...(staticConfig.extra || {}),
      spatialAnchorProvider: provider,
      spatialAnchorTtlDays: Math.max(1, Math.min(365, Math.round(Number(process.env.EXPO_PUBLIC_SPATIAL_ANCHOR_TTL_DAYS || 1))))
    }
  };
};
