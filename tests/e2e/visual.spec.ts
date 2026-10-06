import { test, expect } from '@playwright/test';
import * as helpers from './helpers';

/**
 * Visual Regression Tests
 * 
 * Captures screenshots for visual comparison.
 * Run first time to create baseline, then compare on subsequent runs.
 */

test.describe('📸 Visual Regression', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await helpers.waitForAppReady(page);
    await helpers.ensureLoggedIn(page);
  });

  test('Practice tab visual', async ({ page }) => {
    await page.click('button[data-view="practice"]');
    await page.waitForTimeout(500);
    await page.click('#tutorialClose').catch(() => {});
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('practice-tab.png', {
      maxDiffPixelRatio: 0.1,
      fullPage: false
    });
  });

  test('Stats tab visual', async ({ page }) => {
    await page.click('button[data-view="stats"]');
    await page.waitForTimeout(500);
    await page.click('#tutorialClose').catch(() => {});
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('stats-tab.png', {
      maxDiffPixelRatio: 0.1,
      fullPage: false
    });
  });

  test('Games tab visual', async ({ page }) => {
    await page.click('button[data-view="games"]');
    await page.waitForTimeout(500);
    await page.click('#tutorialClose').catch(() => {});
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('games-tab.png', {
      maxDiffPixelRatio: 0.1,
      fullPage: false
    });
  });

  test('Leaderboard tab visual', async ({ page }) => {
    await page.click('button[data-view="leaderboard"]');
    await page.waitForTimeout(500);
    await page.click('#tutorialClose').catch(() => {});
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('leaderboard-tab.png', {
      maxDiffPixelRatio: 0.1,
      fullPage: false
    });
  });

  test('Achievements tab visual', async ({ page }) => {
    await page.click('button[data-view="achievements"]');
    await page.waitForTimeout(500);
    await page.click('#tutorialClose').catch(() => {});
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('achievements-tab.png', {
      maxDiffPixelRatio: 0.1,
      fullPage: false
    });
  });

  test('Routines tab visual', async ({ page }) => {
    await page.click('button[data-view="routines"]');
    await page.waitForTimeout(500);
    await page.click('#tutorialClose').catch(() => {});
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('routines-tab.png', {
      maxDiffPixelRatio: 0.1,
      fullPage: false
    });
  });
});

test.describe('📱 Mobile Visual', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await helpers.waitForAppReady(page);
    await helpers.ensureLoggedIn(page);
  });

  test('Mobile practice tab visual', async ({ page }) => {
    await page.click('button[data-view="practice"]');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('mobile-practice-tab.png', {
      maxDiffPixelRatio: 0.1,
      fullPage: false
    });
  });

  test('Mobile games tab visual', async ({ page }) => {
    await page.click('button[data-view="games"]');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('mobile-games-tab.png', {
      maxDiffPixelRatio: 0.1,
      fullPage: false
    });
  });
});
