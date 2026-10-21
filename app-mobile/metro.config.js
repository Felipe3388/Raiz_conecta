const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Adiciona as configurações de proxy para evitar erro de CORS no modo web
if (config.server) {
  config.server.proxy = {
    '/api': {
      target: 'https://raizconecta.com.br',
      changeOrigin: true,
      secure: false,
    },
  };
}

module.exports = config;
