const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude android and ios build directories from the file watcher to prevent watch crashes (e.g. ENOENT on gradle files)
config.resolver.blockList = [
  /android\/.*/,
  /ios\/.*/,
];

module.exports = config;
