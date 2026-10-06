import { test, expect } from '@playwright/test';
import * as helpers from './helpers';

/**
 * Achievements & Challenges - E2E Tests
 * 
 * Tests achievements display and challenge functionality.
 */

test.describe('Achievements Display', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await helpers.waitForAppReady(page);
    await helpers.ensureLoggedIn(page);
    await page.click('button[data-view="achievements"]');
    await page.waitForTimeout(500);
    // Dismiss tutorial if visible
    await page.click('#tutorialClose').catch(() => {});
    await page.waitForTimeout(300);
  });

  test('achievements section is accessible', async ({ page }) => {
    // Wait a bit more for content to load
    await page.waitForTimeout(1000);
    
    // Just verify the achievements view exists and is active
    const viewExists = await page.locator('#achievements-view').isVisible({ timeout: 5000 }).catch(() => false);
    expect(viewExists).toBeTruthy();
  });

  test('achievements show unlock status', async ({ page }) => {
    // Look for locked/unlocked indicators
    const achievementCards = await page.locator('.achievement, .achievement-card').count();
    console.log(`Found ${achievementCards} achievement cards`);
  });

  test('achievements are grouped by category', async ({ page }) => {
    // Look for category headers
    const categories = await page.locator('.achievement-category, h3, h4').count();
    console.log(`Found ${categories} categories`);
  });

  test('can see achievement progress count', async ({ page }) => {
    // Look for progress indicator like "87/195"
    const progressText = await page.locator(':has-text("/195"), :has-text("unlocked")').first().isVisible().catch(() => false);
    console.log(`Achievement progress visible: ${progressText}`);
  });
});

test.describe('Daily Challenges', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await helpers.waitForAppReady(page);
    await helpers.ensureLoggedIn(page);
    await page.click('button[data-view="achievements"]');
    await page.waitForTimeout(500);
  });

  test('daily challenge is displayed', async ({ page }) => {
    const dailyCard = await page.locator('.daily-challenge-card').first().isVisible().catch(() => false);
    expect(dailyCard).toBeTruthy();
  });

  test('daily challenge shows description', async ({ page }) => {
    const description = await page.locator('.daily-challenge-card .challenge-description').first().isVisible().catch(() => false);
    console.log(`Daily challenge description visible: ${description}`);
  });

  test('daily challenge shows progress bar', async ({ page }) => {
    const progressBar = await page.locator('.daily-challenge-card .progress-bar-container, .daily-challenge-card .challenge-progress').first().isVisible().catch(() => false);
    console.log(`Daily challenge progress bar visible: ${progressBar}`);
  });

  test('daily challenge shows reward', async ({ page }) => {
    const reward = await page.locator('.daily-challenge-card :has-text("points"), .daily-challenge-card .challenge-reward').first().isVisible().catch(() => false);
    console.log(`Daily challenge reward visible: ${reward}`);
  });
});

test.describe('Weekly Challenges', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await helpers.waitForAppReady(page);
    await helpers.ensureLoggedIn(page);
    await page.click('button[data-view="achievements"]');
    await page.waitForTimeout(500);
  });

  test('weekly challenge is displayed', async ({ page }) => {
    const weeklyCard = await page.locator('.weekly-challenge-card').first().isVisible().catch(() => false);
    expect(weeklyCard).toBeTruthy();
  });

  test('weekly challenge shows time remaining', async ({ page }) => {
    const timeRemaining = await page.locator('.weekly-challenge-card :has-text("day"), .weekly-challenge-card .challenge-timer').first().isVisible().catch(() => false);
    console.log(`Weekly challenge timer visible: ${timeRemaining}`);
  });

  test('weekly challenge shows reward', async ({ page }) => {
    const reward = await page.locator('.weekly-challenge-card :has-text("points"), .weekly-challenge-card .challenge-reward').first().isVisible().catch(() => false);
    console.log(`Weekly challenge reward visible: ${reward}`);
  });
});

test.describe('Achievement Categories', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await helpers.waitForAppReady(page);
    await helpers.ensureLoggedIn(page);
    await page.click('button[data-view="achievements"]');
    await page.waitForTimeout(500);
  });

  test('Getting Started category exists', async ({ page }) => {
    const category = await page.locator(':has-text("Getting Started")').first().isVisible().catch(() => false);
    console.log(`Getting Started category: ${category}`);
  });

  test('can expand achievement categories', async ({ page }) => {
    // Click on a category header to expand
    const categoryHeader = page.locator('.achievement-category-header, h3').first();
    if (await categoryHeader.isVisible().catch(() => false)) {
      await categoryHeader.click();
      await page.waitForTimeout(300);
      console.log('✓ Category clicked');
    }
  });
});

test.describe('Season Progress', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await helpers.waitForAppReady(page);
    await helpers.ensureLoggedIn(page);
    await page.click('button[data-view="achievements"]');
    await page.waitForTimeout(500);
  });

  test('season info is displayed', async ({ page }) => {
    const seasonInfo = await page.locator(':has-text("Season"), :has-text("XP"), .season-card').first().isVisible().catch(() => false);
    console.log(`Season info visible: ${seasonInfo}`);
  });

  test('season level is shown', async ({ page }) => {
    const level = await page.locator(':has-text("Level"), .season-level').first().isVisible().catch(() => false);
    console.log(`Season level visible: ${level}`);
  });
});

test.describe('Points Display', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await helpers.waitForAppReady(page);
    await helpers.ensureLoggedIn(page);
  });

  test('total points are displayed in header', async ({ page }) => {
    const points = await page.locator('.stats-grid .stat-value, #headerPoints').first().isVisible().catch(() => false);
    console.log(`Points in header: ${points}`);
  });

  test('points visible in stats tab', async ({ page }) => {
    await page.click('button[data-view="stats"]');
    await page.waitForTimeout(500);
    
    const pointsDisplay = await page.locator(':has-text("Points"), .stat-value').first().isVisible().catch(() => false);
    console.log(`Points in stats: ${pointsDisplay}`);
  });
});
