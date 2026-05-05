module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // This plugin allows us to use short import aliases like @core, @shared, @modules
      // instead of long relative paths like ../../../core/api/api-client
      [
        'module-resolver',
        {
          root: ['.'],
          alias: {
            '@core': './src/core',
            '@modules': './src/modules',
            '@shared': './src/shared',
            '@stores': './src/stores',
            '@assets': './assets',
            '@screen-styles': './src/screen-styles',
          },
        },
      ],
      // Required by react-native-reanimated v4 — the plugin lives in react-native-worklets now.
      // MUST be the last plugin in the list.
      'react-native-worklets/plugin',
    ],
  };
};
