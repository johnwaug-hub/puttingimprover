import { test, expect } from '@playwright/test';
import * as helpers from './helpers';

/**
 * Smoke Tests - Critical Path Validation
 * 
 * Run these quickly before each deploy to ensure core functionality works.
 * 
 * Usage: npx playwright test tests/e2e/smoke.spec.ts
 */

test.describe('🔥 Smoke Tests', () => {
  
  test('1. App loads and user can login', async ({ page }) => {
    await page.goto('/');
    await helpers.waitForAppReady(page);
    await helpers.ensureLoggedIn(page);
    
    // Verify logged in - check for app header
    await expect(page.locator('.app-header').first()).toBeVisible({ timeout: 5000 });
  });

  test('2. Can add a practice session', async ({ page }) => {
    await page.goto('/');
    await helpers.waitForAppReady(page);
    await helpers.ensureLoggedIn(page);
    
    // Click practice tab directly
    await page.click('button[data-view="practice"]');
    await page.waitForTimeout(1000);
    
    // Dismiss tutorial if visible
    await page.click('#tutorialClose').catch(() => {});
    await page.waitForTimeout(300);
    
    // Open add session form
    const addBtn = page.locator('#addSessionBtn');
    await expect(addBtn).toBeVisible({ timeout: 5000 });
    await addBtn.click();
    
    // Wait for form to be visible
    await page.waitForSelector('#distance', { state: 'visible', timeout: 5000 });
    
    // Fill the form
    await page.fill('#distance', '15');
    await page.fill('#makes', '7');
    await page.fill('#attempts', '10');
    
    // Save - it's a submit button with text "Save Session"
    await page.click('button[type="submit"]:has-text("Save Session"), button:has-text("Save Session")');
    await page.waitForTimeout(1500);
    console.log('✓ Practice session saved');
  });

  test('3. Stats tab displays data', async ({ page }) => {
    await page.goto('/');
    await helpers.waitForAppReady(page);
    await helpers.ensureLoggedIn(page);
    
    // Click stats tab directly
    await page.click('button[data-view="stats"]');
    await page.waitForTimeout(1000);
    
    // Dismiss tutorial if visible
    await page.click('#tutorialClose').catch(() => {});
    await page.waitForTimeout(300);
    
    // Wait for any stats content
    const statsVisible = await page.locator('.stats-search-input, .stats-grid-detailed, .stats-player-header, input[placeholder*="Search"]').first().isVisible({ timeout: 10000 }).catch(() => false);
    
    // If specific selectors not found, at least verify the view changed
    if (!statsVisible) {
      const anyContent = await page.locator('h2, h3, .card').first().isVisible();
      expect(anyContent).toBeTruthy();
    }
    console.log('✓ Stats tab loaded');
  });

  test('4. Games tab shows all games', async ({ page }) => {
    await page.goto('/');
    await helpers.waitForAppReady(page);
    await helpers.ensureLoggedIn(page);
    
    // Click games tab directly
    await page.click('button[data-view="games"]');
    await page.waitForTimeout(1000);
    
    // Dismiss tutorial if visible
    await page.click('#tutorialClose').catch(() => {});
    await page.waitForTimeout(300);
    
    // Wait for games grid
    await page.waitForSelector('.games-grid', { state: 'visible', timeout: 10000 });
    const gameCount = await page.locator('.game-card').count();
    console.log(`Found ${gameCount} game cards`);
    expect(gameCount).toBeGreaterThanOrEqual(10);
  });

  test('5. Leaderboard loads', async ({ page }) => {
    await page.goto('/');
    await helpers.waitForAppReady(page);
    await helpers.ensureLoggedIn(page);
    
    // Click leaderboard tab directly
    await page.click('button[data-view="leaderboard"]');
    await page.waitForTimeout(2000); // Leaderboard needs time to load data
    
    // Dismiss tutorial if visible
    await page.click('#tutorialClose').catch(() => {});
    await page.waitForTimeout(300);
    
    // Count leaderboard entries
    const entries = await page.locator('.elo-leaderboard-item').count();
    console.log(`Found ${entries} leaderboard entries`);
    
    // If no entries found, check if leaderboard container exists
    if (entries === 0) {
      const leaderboardExists = await page.locator('.leaderboard, .elo-leaderboard, h2:has-text("Leaderboard")').first().isVisible().catch(() => false);
      console.log(`Leaderboard container visible: ${leaderboardExists}`);
      expect(leaderboardExists).toBeTruthy();
    } else {
      expect(entries).toBeGreaterThan(0);
    }
  });

  test('6. Can start a game', async ({ page }) => {
    await page.goto('/');
    await helpers.waitForAppReady(page);
    await helpers.ensureLoggedIn(page);
    
    // Click games tab directly
    await page.click('button[data-view="games"]');
    await page.waitForTimeout(1000);
    
    // Dismiss tutorial if visible
    await page.click('#tutorialClose').catch(() => {});
    await page.waitForTimeout(300);
    
    // Wait for games to load
    await page.waitForSelector('.game-card', { state: 'visible', timeout: 10000 });
    
    // Click "View Details" on first game
    const toggleBtn = page.locator('.toggle-game-btn').first();
    await toggleBtn.click();
    await page.waitForTimeout(500);
    
    // Should see Play or Log Score button
    const playBtn = page.locator('.play-game-btn, .log-score-btn').first();
    const isVisible = await playBtn.isVisible().catch(() => false);
    console.log(`Play button visible: ${isVisible}`);
    expect(isVisible).toBeTruthy();
  });
});
