/**
 * Configuration loader
 */

const path = require('path');

const environment = process.env.NODE_ENV || 'development';

let config;
try {
  config = require(path.join(__dirname, `${environment}.js`));
} catch (error) {
  console.warn(`Configuration file for environment '${environment}' not found. Using development config.`);
  config = require('./development.js');
}

module.exports = config;