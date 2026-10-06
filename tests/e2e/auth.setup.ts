import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../.auth/user.json');

/**
 * Authentication Setup
 * 
 * This runs before all tests to authenticate as the test user.
 * The auth state is saved and reused by all subsequent tests.
 * 
 * For Google Sign-In, we need to use a test account or mock auth.
 * This setup handles both scenarios.
 */

setup('authenticate', async ({ page }) => {
  console.log('🔐 Starting authentication setup...');
  
  // Navigate to the app
  await page.goto('/');
  
  // Wait for the app to load
  await page.waitForLoadState('networkidle');
  
  // Check if already logged in (from previous session)
  const isLoggedIn = await page.locator('.app-header').first().isVisible().catch(() => false);
  
  if (isLoggedIn) {
    console.log('✅ Already logged in!');
    // Dismiss tutorial if visible
    await page.click('#tutorialClose, #closeTutorial, .tutorial-close').catch(() => {});
    await page.context().storageState({ path: authFile });
    return;
  }
  
  // Wait for login buttons
  await page.waitForSelector('#showEmailAuthBtn, #googleSignInBtn', { state: 'visible', timeout: 15000 });
  
  console.log('📱 Email sign-in button found, clicking...');
  await page.click('#showEmailAuthBtn');
  
  // Wait for email form
  await page.waitForSelector('#emailInput', { state: 'visible', timeout: 5000 });
  
  // Fill in test credentials
  const testEmail = process.env.TEST_EMAIL || 'johnwaug@hotmail.com';
  const testPassword = process.env.TEST_PASSWORD || 'nov301';
  
  console.log(`📧 Filling email: ${testEmail}`);
  await page.fill('#emailInput', testEmail);
  await page.fill('#passwordInput', testPassword);
  
  // Click submit
  await page.click('button[type="submit"]');
  
  // Wait for auth to complete
  await page.waitForSelector('.app-header', { timeout: 30000 });
  console.log('✅ Email authentication successful!');
  
  // Wait for tutorial to potentially appear (1500ms delay for new users) then dismiss it
  await page.waitForTimeout(2000);
  for (let i = 0; i < 3; i++) {
    const tutorialClose = page.locator('#tutorialClose').first();
    if (await tutorialClose.isVisible().catch(() => false)) {
      console.log('📖 Dismissing tutorial...');
      await tutorialClose.click();
      await page.waitForTimeout(500);
      break;
    }
    await page.waitForTimeout(300);
  }
  
  // Save authentication state
  await page.context().storageState({ path: authFile });
  console.log('💾 Authentication state saved to', authFile);
});
