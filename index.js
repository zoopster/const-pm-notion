#!/usr/bin/env node

/**
 * Construction Project Management - Notion Integration
 * Main application entry point
 * 
 * @author John Pugh
 * @description Automated construction project management system using Notion API
 */

require('dotenv').config();

const NotionAPI = require('./src/api');
const { validateEnvironment, logger } = require('./src/utils');
const config = require('./configs');

class ConstructionPM {
  constructor() {
    this.logger = logger;
    this.config = config;
    this.notionAPI = null;
  }

  /**
   * Initialize the application
   */
  async initialize() {
    try {
      this.logger.info('Initializing Construction PM Notion Integration...');
      
      // Validate environment
      if (!validateEnvironment()) {
        throw new Error('Environment validation failed');
      }
      
      // Initialize Notion API
      this.notionAPI = new NotionAPI(process.env.NOTION_API_TOKEN);
      await this.notionAPI.initialize();
      
      this.logger.info('Application initialized successfully');
      return this;
    } catch (error) {
      this.logger.error('Failed to initialize application:', error);
      throw error;
    }
  }

  /**
   * Start the application
   */
  async start() {
    try {
      await this.initialize();
      
      this.logger.info('Construction PM application started');
      this.logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      this.logger.info(`Port: ${this.config.server?.port || 'N/A'}`);
      
      // Application logic will be added here
      // For now, just keep the process alive
      process.on('SIGINT', () => this.gracefulShutdown());
      process.on('SIGTERM', () => this.gracefulShutdown());
      
    } catch (error) {
      this.logger.error('Failed to start application:', error);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  async gracefulShutdown() {
    this.logger.info('Shutting down gracefully...');
    // Add cleanup logic here
    process.exit(0);
  }
}

// Start the application if this file is run directly
if (require.main === module) {
  const app = new ConstructionPM();
  app.start().catch(error => {
    console.error('Application startup failed:', error);
    process.exit(1);
  });
}

module.exports = ConstructionPM;