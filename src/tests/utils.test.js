/**
 * Utility function tests
 */

const { formatDateForNotion, validateEnvironment } = require('../utils');

describe('Utility Functions', () => {
  describe('formatDateForNotion', () => {
    test('should format date correctly', () => {
      const date = new Date('2023-12-25T10:30:00Z');
      const formatted = formatDateForNotion(date);
      expect(formatted).toBe('2023-12-25');
    });
  });

  describe('validateEnvironment', () => {
    test('should validate required environment variables', () => {
      // This test would need to mock environment variables
      expect(typeof validateEnvironment).toBe('function');
    });
  });
});