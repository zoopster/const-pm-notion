/**
 * Utility functions for construction project management
 */

const logger = require('./logger');

/**
 * Format date for Notion API
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDateForNotion(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Validate environment variables
 * @returns {boolean} True if all required env vars are present
 */
function validateEnvironment() {
  const required = ['NOTION_API_TOKEN', 'NOTION_DATABASE_ID'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing.join(', ')}`);
    return false;
  }
  
  return true;
}

/**
 * Retry function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delay - Initial delay in ms
 * @returns {Promise} Promise that resolves with function result
 */
async function retryWithBackoff(fn, maxRetries = 3, delay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
}

module.exports = {
  formatDateForNotion,
  validateEnvironment,
  retryWithBackoff,
  logger,
};