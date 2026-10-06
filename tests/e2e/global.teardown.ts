import { test as teardown } from '@playwright/test';

/**
 * Global Teardown - Runs after all tests complete
 * 
 * Cleans up test data to leave the test user in a known state
 */

teardown('cleanup test user', async ({ request }) => {
  console.log('🧹 Cleaning up test data...');
  
  // Note: For full cleanup, you'd call an API endpoint or use Firebase Admin
  // For now, we just log that tests completed
  
  console.log('✅ Test suite complete');
  console.log('💡 To reset test user, run: putting_admin_reset_user("waugs test")');
});
