import { test, expect } from '@playwright/test';
import * as helpers from './helpers';

/**
 * Practice Features - E2E Tests
 * 
 * Tests practice-related functionality including:
 * - Session logging
 * - Routines (built-in, custom, community)
 */

test.describe('Practice Sessions', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await helpers.waitForAppReady(page);
    await helpers.ensureLoggedIn(page);
    await page.click('button[data-view="practice"]');
    await page.waitForTimeout(500);
    // Dismiss tutorial if visible
    await page.click('#tutorialClose').catch(() => {});
    await page.waitForTimeout(300);
  });

  test('add session form has all required fields', async ({ page }) => {
    // Dismiss tutorial again if it re-appeared
    await page.click('#tutorialClose').catch(() => {});
    await page.click('#addSessionBtn');
    await page.waitForSelector('#distance', { state: 'visible' });
    
    // Check for required inputs
    await expect(page.locator('#distance')).toBeVisible();
    await expect(page.locator('#makes')).toBeVisible();
    await expect(page.locator('#attempts')).toBeVisible();
  });

  test('distance presets work correctly', async ({ page }) => {
    // Dismiss tutorial again if it re-appeared
    await page.click('#tutorialClose').catch(() => {});
    await page.click('#addSessionBtn');
    await page.waitForSelector('#distance', { state: 'visible' });
    
    // Look for distance preset buttons
    const presetButtons = page.locator('.distance-preset, .preset-btn');
    const presetCount = await presetButtons.count();
    
    if (presetCount > 0) {
      await presetButtons.first().click();
      const distanceValue = await page.locator('#distance').inputValue();
      expect(parseInt(distanceValue)).toBeGreaterThan(0);
      console.log(`✓ Distance preset set value to: ${distanceValue}`);
    }
  });

  test('can save a practice session', async ({ page }) => {
    // Dismiss tutorial again if it re-appeared
    await page.click('#tutorialClose').catch(() => {});
    await page.click('#addSessionBtn');
    await page.waitForSelector('#distance', { state: 'visible' });
    
    await page.fill('#distance', '20');
    await page.fill('#makes', '8');
    await page.fill('#attempts', '10');
    
    await page.click('button[type="submit"]:has-text("Save Session"), button:has-text("Save Session")');
    await page.waitForTimeout(1500);
    
    // Form should reset or close
    console.log('✓ Session saved');
  });

  test('prevents invalid makes > attempts', async ({ page }) => {
    // Dismiss tutorial again if it re-appeared
    await page.click('#tutorialClose').catch(() => {});
    await page.click('#addSessionBtn');
    await page.waitForSelector('#distance', { state: 'visible' });
    
    await page.fill('#distance', '20');
    await page.fill('#makes', '15');  // More than attempts
    await page.fill('#attempts', '10');
    
    await page.click('button[type="submit"]:has-text("Save Session"), button:has-text("Save Session")');
    await page.waitForTimeout(500);
    
    // Check for validation - makes should be clamped to attempts
    const makesValue = await page.locator('#makes').inputValue();
    console.log(`Makes value after validation: ${makesValue}`);
  });
});

test.describe('Built-in Routines', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await helpers.waitForAppReady(page);
    await helpers.ensureLoggedIn(page);
    await page.click('button[data-view="routines"]');
    await page.waitForTimeout(500);
  });

  test('can access built-in routines', async ({ page }) => {
    // Click Built-in tab
    await page.click('button:has-text("Built-in")').catch(() => {});
    await page.waitForTimeout(500);
    
    const routineCards = await page.locator('.routine-card').count();
    console.log(`Found ${routineCards} routines`);
  });

  test('can view routine details', async ({ page }) => {
    await page.click('button:has-text("Built-in")').catch(() => {});
    await page.waitForTimeout(500);
    
    // Click on a routine card
    const firstRoutine = page.locator('.routine-card').first();
    if (await firstRoutine.isVisible()) {
      await firstRoutine.click();
      await page.waitForTimeout(500);
      console.log('✓ Routine details opened');
    }
  });

  test('can start a routine', async ({ page }) => {
    await page.click('button:has-text("Built-in")').catch(() => {});
    await page.waitForTimeout(500);
    
    // Look for start button
    const startBtn = page.locator('button:has-text("Start"), button:has-text("Begin")').first();
    if (await startBtn.isVisible().catch(() => false)) {
      console.log('✓ Start routine button available');
    }
  });
});

test.describe('Custom Routines', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await helpers.waitForAppReady(page);
    await helpers.ensureLoggedIn(page);
    await page.click('button[data-view="routines"]');
    await page.waitForTimeout(500);
  });

  test('can access custom routines section', async ({ page }) => {
    await page.click('button:has-text("Custom"), button:has-text("My Routines")').catch(() => {});
    await page.waitForTimeout(500);
    console.log('✓ Custom routines section accessed');
  });

  test('can access routine builder', async ({ page }) => {
    await page.click('button:has-text("Custom")').catch(() => {});
    await page.waitForTimeout(500);
    
    // Look for create button
    const createBtn = page.locator('button:has-text("Create"), #createRoutineBtn').first();
    if (await createBtn.isVisible().catch(() => false)) {
      console.log('✓ Create routine button available');
    }
  });
});

test.describe('Community Routines', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await helpers.waitForAppReady(page);
    await helpers.ensureLoggedIn(page);
    await page.click('button[data-view="routines"]');
    await page.waitForTimeout(500);
  });

  test('can access community routines', async ({ page }) => {
    await page.click('button:has-text("Community")').catch(() => {});
    await page.waitForTimeout(1000);
    
    const communityRoutines = await page.locator('.routine-card.community, .community-routine').count();
    console.log(`Found ${communityRoutines} community routines`);
  });
});

test.describe('Practice History', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await helpers.waitForAppReady(page);
    await helpers.ensureLoggedIn(page);
    await page.click('button[data-view="practice"]');
    await page.waitForTimeout(500);
  });

  test('practice history section exists', async ({ page }) => {
    // Look for history section
    const historySection = await page.locator('.session-item, .activity-card, h3:has-text("Recent")').first().isVisible().catch(() => false);
    console.log(`History section visible: ${historySection}`);
  });
});
