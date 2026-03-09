const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Permitir arquivos .wasm no web
config.resolver.assetExts.push('wasm');

module.exports = config;