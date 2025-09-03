/**
 * Development configuration
 */

module.exports = {
  notion: {
    version: process.env.NOTION_VERSION || '2022-06-28',
    timeout: parseInt(process.env.API_TIMEOUT) || 30000,
    retryAttempts: parseInt(process.env.RETRY_ATTEMPTS) || 3,
    retryDelay: parseInt(process.env.RETRY_DELAY) || 1000,
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    enableConsole: true,
    enableFile: true,
  },
  
  server: {
    port: parseInt(process.env.PORT) || 3000,
    host: process.env.HOST || 'localhost',
  },
  
  cache: {
    ttl: parseInt(process.env.CACHE_TTL) || 3600,
  },
};