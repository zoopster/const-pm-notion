/**
 * Production configuration
 */

module.exports = {
  notion: {
    version: process.env.NOTION_VERSION || '2022-06-28',
    timeout: parseInt(process.env.API_TIMEOUT) || 30000,
    retryAttempts: parseInt(process.env.RETRY_ATTEMPTS) || 5,
    retryDelay: parseInt(process.env.RETRY_DELAY) || 2000,
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableConsole: false,
    enableFile: true,
  },
  
  server: {
    port: parseInt(process.env.PORT) || 8080,
    host: process.env.HOST || '0.0.0.0',
  },
  
  cache: {
    ttl: parseInt(process.env.CACHE_TTL) || 7200,
  },
};