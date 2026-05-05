const { getDefaultConfig } = require('expo/metro-config');

// Get the default Expo Metro configuration.
// This is required by Expo Router for typed routes and proper file discovery.
const defaultMetroConfig = getDefaultConfig(__dirname);

module.exports = defaultMetroConfig;
