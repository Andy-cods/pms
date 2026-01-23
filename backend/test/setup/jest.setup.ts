/**
 * Jest setup file for E2E tests
 * Runs before all test suites
 */

// Set test environment variables
process.env.NODE_ENV = 'test';

// Increase timeout for integration tests
jest.setTimeout(30000);

// Global setup
beforeAll(async () => {
  console.log('🧪 Starting E2E test suite...');
});

// Global teardown
afterAll(async () => {
  console.log('✅ E2E test suite completed');
});
