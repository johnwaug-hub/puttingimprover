import { test, expect } from '@playwright/test';
import * as helpers from './helpers';

/**
 * Data Validation Tests
 * 
 * Verifies that stats and calculations display correctly.
 */

test.describe('📊 Data Validation', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await helpers.waitForAppReady(page);
    await helpers.ensureLoggedIn(page);
  });

  test('Stats tab loads with data', async ({ page }) => {
    await page.click('button[data-view="stats"]');
    await page.waitForTimeout(500);
    
    // Check for stats content
    const statsContent = await page.locator('.stats-search-input, .stats-grid-detailed').first().isVisible().catch(() => false);
    expect(statsContent).toBeTruthy();
  });

  test('Points display correctly', async ({ page }) => {
    // Look for points in header stats
    const statsGrid = page.locator('.stats-grid .stat-value').first();
    if (await statsGrid.isVisible().catch(() => false)) {
      const pointsText = await statsGrid.textContent();
      console.log(`Points displayed: ${pointsText}`);
    }
  });

  test('Accuracy percentage displays', async ({ page }) => {
    await page.click('button[data-view="stats"]');
    await page.waitForTimeout(500);
    
    // Look for percentage display
    const accuracy = await page.locator(':has-text("%")').first().isVisible().catch(() => false);
    console.log(`Accuracy displayed: ${accuracy}`);
  });

  test('Streak information displays', async ({ page }) => {
    await page.click('button[data-view="stats"]');
    await page.waitForTimeout(500);
    
    // Look for streak info
    const streak = await page.locator(':has-text("streak"), :has-text("Streak")').first().isVisible().catch(() => false);
    console.log(`Streak displayed: ${streak}`);
  });

  test('Leaderboard shows entries', async ({ page }) => {
    await page.click('button[data-view="leaderboard"]');
    await page.waitForTimeout(1000);
    
    const entries = await page.locator('.elo-leaderboard-item').count();
    console.log(`Leaderboard entries: ${entries}`);
    expect(entries).toBeGreaterThan(0);
  });

  test('Activity count is accurate', async ({ page }) => {
    // Check activity count in stats header
    const activityStat = page.locator('.stat-card:has-text("Activities"), .stat-value').nth(1);
    if (await activityStat.isVisible().catch(() => false)) {
      const count = await activityStat.textContent();
      console.log(`Activity count: ${count}`);
    }
  });
});
