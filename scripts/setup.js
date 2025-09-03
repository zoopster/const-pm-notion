#!/usr/bin/env node

/**
 * Setup script for construction PM Notion integration
 * Validates environment and creates necessary directories
 */

const fs = require('fs');
const path = require('path');
const { validateEnvironment, logger } = require('../src/utils');

async function setup() {
  logger.info('Starting setup process...');
  
  // Create necessary directories
  const dirs = [
    'logs',
    'uploads',
    'exports',
    'backups',
  ];
  
  for (const dir of dirs) {
    const dirPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      logger.info(`Created directory: ${dir}`);
    }
  }
  
  // Validate environment
  if (!validateEnvironment()) {
    logger.error('Setup failed: Missing required environment variables');
    logger.info('Please copy .env.example to .env and fill in the required values');
    process.exit(1);
  }
  
  logger.info('Setup completed successfully!');
}

if (require.main === module) {
  setup().catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}

module.exports = setup;