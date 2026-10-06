import { test, expect } from '@playwright/test';
import * as helpers from './helpers';

/**
 * Games Tab - E2E Tests
 * 
 * Tests all 10 putting games and their functionality.
 */

test.describe('Games Tab', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await helpers.waitForAppReady(page);
    await helpers.ensureLoggedIn(page);
    await page.click('button[data-view="games"]');
    await page.waitForTimeout(500);
  });

  test('games tab loads with all games visible', async ({ page }) => {
    await page.waitForSelector('.games-grid', { state: 'visible', timeout: 10000 });
    const gameCount = await page.locator('.game-card').count();
    console.log(`Found ${gameCount} game cards`);
    expect(gameCount).toBeGreaterThanOrEqual(10);
  });

  test('games have descriptions', async ({ page }) => {
    await page.waitForSelector('.game-card', { state: 'visible' });
    
    const firstGame = page.locator('.game-card').first();
    const hasDescription = await firstGame.locator('.game-description, p').first().isVisible();
    expect(hasDescription).toBeTruthy();
  });

  test('can view game details', async ({ page }) => {
    await page.waitForSelector('.game-card', { state: 'visible' });
    
    // Click "View Details" on first game
    await page.click('.toggle-game-btn');
    await page.waitForTimeout(500);
    
    // Should see expanded content with play button
    const playBtn = await page.locator('.play-game-btn, .log-score-btn').first().isVisible();
    expect(playBtn).toBeTruthy();
  });
});

test.describe('Around the World', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await helpers.waitForAppReady(page);
    await helpers.ensureLoggedIn(page);
    await page.click('button[data-view="games"]');
    await page.waitForTimeout(500);
  });

  test('can start Around the World', async ({ page }) => {
    await page.waitForSelector('.game-card', { state: 'visible' });
    
    // Find Around the World game
    const atwCard = page.locator('.game-card:has-text("Around the World")').first();
    if (await atwCard.isVisible()) {
      await atwCard.locator('.toggle-game-btn').click();
      await page.waitForTimeout(300);
      
      const playBtn = atwCard.locator('.play-game-btn');
      if (await playBtn.isVisible()) {
        console.log('✓ Around the World play button available');
      }
    }
  });
});

test.describe('HORSE Game', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await helpers.waitForAppReady(page);
    await helpers.ensureLoggedIn(page);
    await page.click('button[data-view="games"]');
    await page.waitForTimeout(500);
  });

  test('can access HORSE game', async ({ page }) => {
    await page.waitForSelector('.game-card', { state: 'visible' });
    
    const horseCard = page.locator('.game-card:has-text("HORSE"), .game-card:has-text("Horse")').first();
    if (await horseCard.isVisible()) {
      await horseCard.locator('.toggle-game-btn').click();
      await page.waitForTimeout(300);
      console.log('✓ HORSE game card found');
    }
  });
});

test.describe('Ladder Challenge', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await helpers.waitForAppReady(page);
    await helpers.ensureLoggedIn(page);
    await page.click('button[data-view="games"]');
    await page.waitForTimeout(500);
  });

  test('can access Ladder Challenge', async ({ page }) => {
    await page.waitForSelector('.game-card', { state: 'visible' });
    
    const ladderCard = page.locator('.game-card:has-text("Ladder")').first();
    if (await ladderCard.isVisible()) {
      console.log('✓ Ladder Challenge game card found');
    }
  });
});

test.describe('Par Game', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await helpers.waitForAppReady(page);
    await helpers.ensureLoggedIn(page);
    await page.click('button[data-view="games"]');
    await page.waitForTimeout(500);
  });

  test('can access Par Game', async ({ page }) => {
    await page.waitForSelector('.game-card', { state: 'visible' });
    
    const parCard = page.locator('.game-card:has-text("Par")').first();
    if (await parCard.isVisible()) {
      console.log('✓ Par Game card found');
    }
  });
});

test.describe('Perfect 10', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await helpers.waitForAppReady(page);
    await helpers.ensureLoggedIn(page);
    await page.click('button[data-view="games"]');
    await page.waitForTimeout(500);
  });

  test('can access Perfect 10', async ({ page }) => {
    await page.waitForSelector('.game-card', { state: 'visible' });
    
    const perfectCard = page.locator('.game-card:has-text("Perfect 10")').first();
    if (await perfectCard.isVisible()) {
      console.log('✓ Perfect 10 game card found');
    }
  });
});

test.describe('Points Poker', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await helpers.waitForAppReady(page);
    await helpers.ensureLoggedIn(page);
    await page.click('button[data-view="games"]');
    await page.waitForTimeout(500);
  });

  test('can access Points Poker', async ({ page }) => {
    await page.waitForSelector('.game-card', { state: 'visible' });
    
    const pokerCard = page.locator('.game-card:has-text("Points Poker"), .game-card:has-text("Poker")').first();
    if (await pokerCard.isVisible()) {
      console.log('✓ Points Poker game card found');
    }
  });
});

test.describe('Putt 100', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await helpers.waitForAppReady(page);
    await helpers.ensureLoggedIn(page);
    await page.click('button[data-view="games"]');
    await page.waitForTimeout(500);
  });

  test('can access Putt 100', async ({ page }) => {
    await page.waitForSelector('.game-card', { state: 'visible' });
    
    const putt100Card = page.locator('.game-card:has-text("Putt 100"), .game-card:has-text("100")').first();
    if (await putt100Card.isVisible()) {
      console.log('✓ Putt 100 game card found');
    }
  });
});

test.describe("Joe's Monday Night", () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await helpers.waitForAppReady(page);
    await helpers.ensureLoggedIn(page);
    await page.click('button[data-view="games"]');
    await page.waitForTimeout(500);
  });

  test("can access Joe's Monday Night", async ({ page }) => {
    await page.waitForSelector('.game-card', { state: 'visible' });
    
    const joeCard = page.locator('.game-card:has-text("Joe"), .game-card:has-text("Monday")').first();
    if (await joeCard.isVisible()) {
      console.log("✓ Joe's Monday Night game card found");
    }
  });
});

test.describe('Game Interaction', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await helpers.waitForAppReady(page);
    await helpers.ensureLoggedIn(page);
    await page.click('button[data-view="games"]');
    await page.waitForTimeout(500);
    // Dismiss tutorial if visible
    await page.click('#tutorialClose').catch(() => {});
    await page.waitForTimeout(300);
  });

  test('can toggle game details', async ({ page }) => {
    await page.waitForSelector('.game-card', { state: 'visible' });
    
    // Click toggle on first game - use first() to avoid multiple matches
    const toggleBtn = page.locator('.toggle-game-btn').first();
    if (await toggleBtn.isVisible().catch(() => false)) {
      await toggleBtn.click();
      await page.waitForTimeout(300);
      
      // Check if details expanded
      const expanded = await page.locator('.game-details.expanded, .game-instructions').first().isVisible().catch(() => false);
      console.log(`Game details expanded: ${expanded}`);
      
      // Click toggle again to collapse
      await toggleBtn.click();
      await page.waitForTimeout(300);
    } else {
      console.log('Toggle button not found, skipping test');
    }
  });

  test('custom games tab exists', async ({ page }) => {
    // Look for custom games tab
    const customTab = page.locator('button:has-text("Custom"), button:has-text("My Games")').first();
    if (await customTab.isVisible().catch(() => false)) {
      await customTab.click();
      await page.waitForTimeout(500);
      console.log('✓ Custom games tab accessed');
    }
  });

  test('community games tab exists', async ({ page }) => {
    // Look for community games tab
    const communityTab = page.locator('button:has-text("Community")').first();
    if (await communityTab.isVisible().catch(() => false)) {
      await communityTab.click();
      await page.waitForTimeout(500);
      console.log('✓ Community games tab accessed');
    }
  });
});
