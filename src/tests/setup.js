/**
 * Jest setup file
 * Global test configuration and setup
 */

// Load environment variables for testing
require('dotenv').config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Mock console methods in tests if needed
if (process.env.SILENCE_LOGS === 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

// Global test timeout
jest.setTimeout(30000);

// Mock Notion API for tests
jest.mock('@notionhq/client', () => {
  return {
    Client: jest.fn().mockImplementation(() => ({
      databases: {
        query: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      pages: {
        create: jest.fn(),
        update: jest.fn(),
        retrieve: jest.fn(),
      },
    })),
  };
});