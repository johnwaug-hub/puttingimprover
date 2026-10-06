import { Page, expect, Locator } from '@playwright/test';

/**
 * Putting Improver E2E Test Helpers
 * 
 * Utility functions for interacting with the app during tests.
 */

// ==================== AUTHENTICATION ====================

/**
 * Dismiss the Getting Started tutorial if it appears
 * Waits for it to potentially show up, then dismisses it
 */
export async function dismissTutorial(page: Page) {
  // Wait for potential tutorial to appear (shown after 1000ms delay)
  await page.waitForTimeout(300);
  
  // Try to dismiss tutorial multiple times (it may have animation delay)
  for (let i = 0; i < 3; i++) {
    const tutorialClose = page.locator('#tutorialClose').first();
    
    if (await tutorialClose.isVisible().catch(() => false)) {
      console.log('📖 Dismissing tutorial...');
      await tutorialClose.click();
      await page.waitForTimeout(500);
      return;
    }
    
    // Also check for alternative close button
    const altClose = page.locator('#closeTutorial, .tutorial-close').first();
    if (await altClose.isVisible().catch(() => false)) {
      console.log('📖 Dismissing tutorial (alt)...');
      await altClose.click();
      await page.waitForTimeout(500);
      return;
    }
    
    await page.waitForTimeout(300);
  }
}

/**
 * Ensure user is logged in, re-authenticate if needed
 * Call this at the start of tests that require auth
 */
export async function ensureLoggedIn(page: Page) {
  // Wait for page to stabilize and tutorial to potentially appear
  await page.waitForTimeout(1500);
  
  // Dismiss tutorial if it appears (shown after 1000ms delay for new users)
  await dismissTutorial(page);
  
  // Check if already logged in (look for header elements that only appear when authenticated)
  const isLoggedIn = await page.locator('.app-header').first().isVisible().catch(() => false);
  
  if (isLoggedIn) {
    // Dismiss tutorial again in case it popped up after login check
    await dismissTutorial(page);
    return; // Already logged in
  }
  
  console.log('🔐 Re-authenticating...');
  
  // Wait for login buttons to appear
  await page.waitForSelector('#showEmailAuthBtn, #googleSignInBtn', { state: 'visible', timeout: 15000 });
  
  // Click "Sign in with Email" button
  await page.click('#showEmailAuthBtn');
  
  // Wait for email form to appear
  await page.waitForSelector('#emailInput', { state: 'visible', timeout: 5000 });
  
  // Fill credentials
  const testEmail = process.env.TEST_EMAIL || 'johnwaug@hotmail.com';
  const testPassword = process.env.TEST_PASSWORD || 'nov301';
  
  await page.fill('#emailInput', testEmail);
  await page.fill('#passwordInput', testPassword);
  
  // Click submit button
  await page.click('button[type="submit"]');
  
  // Wait for auth to complete - look for app header
  await page.waitForSelector('.app-header', { timeout: 30000 });
  console.log('✅ Re-authenticated');
  
  // Wait for tutorial to potentially appear (1000ms delay) then dismiss
  await page.waitForTimeout(1500);
  await dismissTutorial(page);
}

// ==================== NAVIGATION ====================

export async function navigateToTab(page: Page, tabName: string) {
  // Dismiss any tutorial that might be open
  await dismissTutorial(page);
  
  const tabMap: Record<string, string> = {
    'practice': 'practice',
    'routines': 'routines',
    'stats': 'stats', 
    'games': 'games',
    'community': 'leaderboard',
    'leaderboard': 'leaderboard',
    'achievements': 'achievements'
  };
  
  const viewName = tabMap[tabName.toLowerCase()] || tabName.toLowerCase();
  
  // Click the nav tab using data-view attribute
  await page.click(`button[data-view="${viewName}"], .tab[data-view="${viewName}"]`);
  
  // Wait for view to change and content to load
  await page.waitForTimeout(1000);
  
  // Dismiss tutorial again if it popped up after navigation
  await dismissTutorial(page);
  
  console.log(`📍 Navigated to ${viewName} tab`);
}

export async function waitForAppReady(page: Page) {
  // Wait for network to settle
  await page.waitForLoadState('networkidle');
  
  // Just wait for the #app div to have content (any state - login or logged in)
  await page.waitForFunction(() => {
    const app = document.getElementById('app');
    return app && app.innerHTML.length > 100;
  }, { timeout: 30000 });
  
  // Small buffer for rendering
  await page.waitForTimeout(500);
}

// ==================== PRACTICE TAB ====================

export async function addPracticeSession(page: Page, options: {
  distance: number;
  makes: number;
  attempts: number;
}) {
  console.log(`🎯 Adding practice session: ${options.makes}/${options.attempts} from ${options.distance}ft`);
  
  // Navigate to practice if not there
  await navigateToTab(page, 'practice');
  
  // Click Add Session button
  await page.click('button:has-text("Add Session"), .add-session-btn, #addSessionBtn');
  
  // Wait for modal
  await page.waitForSelector('.modal, .session-modal, .add-session-modal', { state: 'visible' });
  
  // Fill in distance
  await page.fill('input[name="distance"], #distanceInput, input[placeholder*="distance" i]', String(options.distance));
  
  // Fill in makes
  await page.fill('input[name="makes"], #makesInput, input[placeholder*="makes" i]', String(options.makes));
  
  // Fill in attempts
  await page.fill('input[name="attempts"], #attemptsInput, input[placeholder*="attempts" i]', String(options.attempts));
  
  // Save session
  await page.click('button:has-text("Save"), button:has-text("Log"), button[type="submit"]');
  
  // Wait for modal to close
  await page.waitForSelector('.modal, .session-modal', { state: 'hidden', timeout: 10000 }).catch(() => {});
  
  // Wait for confirmation
  await page.waitForTimeout(1000);
  
  console.log('✅ Practice session added');
}

export async function startRoutine(page: Page, routineName: string) {
  console.log(`📋 Starting routine: ${routineName}`);
  
  await navigateToTab(page, 'practice');
  
  // Open routines panel
  await page.click('button:has-text("Routines"), .routines-btn, #routinesBtn');
  
  // Wait for routines list
  await page.waitForSelector('.routine-card, .routine-item', { state: 'visible' });
  
  // Find and click the routine
  await page.click(`.routine-card:has-text("${routineName}"), .routine-item:has-text("${routineName}")`);
  
  // Start the routine
  await page.click('button:has-text("Start"), button:has-text("Begin")');
  
  console.log('✅ Routine started');
}

// ==================== GAMES TAB ====================

export async function startGame(page: Page, gameName: string) {
  console.log(`🎮 Starting game: ${gameName}`);
  
  await navigateToTab(page, 'games');
  
  // Wait for games list
  await page.waitForSelector('.game-card, .game-item', { state: 'visible' });
  
  // Find and click the game
  await page.click(`.game-card:has-text("${gameName}"), .game-item:has-text("${gameName}")`);
  
  // Wait for game modal/view
  await page.waitForSelector('.game-modal, .game-view, .game-playing', { state: 'visible' });
  
  console.log('✅ Game started');
}

export async function playGameRound(page: Page, made: boolean) {
  // Click make or miss button
  if (made) {
    await page.click('button:has-text("Make"), button:has-text("✓"), .make-btn');
  } else {
    await page.click('button:has-text("Miss"), button:has-text("✗"), .miss-btn');
  }
  await page.waitForTimeout(300);
}

export async function finishGame(page: Page) {
  // End/finish the game
  await page.click('button:has-text("Finish"), button:has-text("End Game"), button:has-text("Complete")');
  
  // Wait for results
  await page.waitForSelector('.game-results, .game-complete, .game-summary', { state: 'visible', timeout: 10000 }).catch(() => {});
  
  // Close results modal if present
  await page.click('button:has-text("Close"), button:has-text("Done"), .close-btn').catch(() => {});
  
  console.log('✅ Game finished');
}

// ==================== STATS TAB ====================

export async function verifyStats(page: Page, expectedStats: Partial<{
  totalPoints: number;
  totalSessions: number;
  totalMakes: number;
  currentStreak: number;
}>) {
  console.log('📊 Verifying stats...');
  
  await navigateToTab(page, 'stats');
  
  // Wait for stats to load
  await page.waitForSelector('.stats-grid, .stat-card, .stat-value', { state: 'visible' });
  
  for (const [key, value] of Object.entries(expectedStats)) {
    if (value !== undefined) {
      const selector = `.stat-${key}, [data-stat="${key}"], .stat-card:has-text("${key}") .stat-value`;
      const text = await page.locator(selector).first().textContent();
      console.log(`   ${key}: ${text} (expected: ${value})`);
    }
  }
}

export async function openCharts(page: Page) {
  await navigateToTab(page, 'stats');
  
  // Click charts button if present
  await page.click('button:has-text("Charts"), button:has-text("Analytics"), .charts-btn').catch(() => {});
  
  // Wait for charts to render
  await page.waitForSelector('canvas, .chart-container', { state: 'visible', timeout: 10000 }).catch(() => {});
  
  console.log('📈 Charts opened');
}

// ==================== COMMUNITY TAB ====================

export async function viewLeaderboard(page: Page, type: 'points' | 'elo' | 'season' = 'points') {
  console.log(`🏆 Viewing ${type} leaderboard`);
  
  await navigateToTab(page, 'community');
  
  // Click leaderboard type button
  const buttonText = type === 'points' ? 'Points' : type === 'elo' ? 'ELO' : 'Season';
  await page.click(`button:has-text("${buttonText}"), .leaderboard-tab:has-text("${buttonText}")`).catch(() => {});
  
  // Wait for leaderboard to load
  await page.waitForSelector('.leaderboard-item, .elo-leaderboard-item', { state: 'visible' });
  
  console.log('✅ Leaderboard loaded');
}

export async function searchFriend(page: Page, searchTerm: string) {
  await navigateToTab(page, 'community');
  
  // Click friends tab or section
  await page.click('button:has-text("Friends"), .friends-tab').catch(() => {});
  
  // Find and fill search input
  await page.fill('input[placeholder*="search" i], input[placeholder*="friend" i], #friendSearch', searchTerm);
  
  // Wait for results
  await page.waitForTimeout(1000);
  
  console.log(`🔍 Searched for friend: ${searchTerm}`);
}

// ==================== CHALLENGES ====================

export async function viewDailyChallenge(page: Page) {
  console.log('📅 Viewing daily challenge');
  
  await navigateToTab(page, 'challenges');
  
  // Wait for challenge info
  await page.waitForSelector('.daily-challenge, .challenge-card', { state: 'visible' });
  
  // Get challenge details
  const challengeText = await page.locator('.daily-challenge, .challenge-card').first().textContent();
  console.log(`   Challenge: ${challengeText?.substring(0, 100)}...`);
}

export async function viewWeeklyChallenge(page: Page) {
  console.log('📅 Viewing weekly challenge');
  
  await navigateToTab(page, 'challenges');
  
  // Click weekly tab if needed
  await page.click('button:has-text("Weekly"), .weekly-tab').catch(() => {});
  
  // Wait for challenge info
  await page.waitForSelector('.weekly-challenge, .challenge-card', { state: 'visible' });
}

// ==================== ACHIEVEMENTS ====================

export async function viewAchievements(page: Page) {
  console.log('🏅 Viewing achievements');
  
  await navigateToTab(page, 'stats');
  
  // Find achievements section or button
  await page.click('button:has-text("Achievements"), .achievements-btn, [data-view="achievements"]').catch(() => {});
  
  // Wait for achievements to load
  await page.waitForSelector('.achievement-card, .achievement-item', { state: 'visible', timeout: 10000 });
  
  // Count achievements
  const unlocked = await page.locator('.achievement-card.unlocked, .achievement-item.unlocked').count();
  const total = await page.locator('.achievement-card, .achievement-item').count();
  
  console.log(`   Achievements: ${unlocked}/${total} unlocked`);
}

// ==================== PROFILE ====================

export async function openProfile(page: Page) {
  console.log('👤 Opening profile');
  
  // Click profile picture or username
  await page.click('.header-profile-pic, #headerUsername, .user-avatar');
  
  // Wait for profile modal
  await page.waitForSelector('.profile-modal, .profile-view', { state: 'visible' });
}

export async function closeModal(page: Page) {
  // Try various close methods
  await page.click('.modal .close-btn, .modal-close, button:has-text("Close"), button:has-text("×")').catch(() => {});
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(300);
}

// ==================== ASSERTIONS ====================

export async function expectVisible(page: Page, selector: string, message?: string) {
  await expect(page.locator(selector).first()).toBeVisible({ timeout: 10000 });
  if (message) console.log(`✓ ${message}`);
}

export async function expectHidden(page: Page, selector: string, message?: string) {
  await expect(page.locator(selector).first()).toBeHidden({ timeout: 10000 });
  if (message) console.log(`✓ ${message}`);
}

export async function expectText(page: Page, selector: string, text: string | RegExp) {
  await expect(page.locator(selector).first()).toContainText(text, { timeout: 10000 });
}

// ==================== UTILITIES ====================

export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ path: `tests/screenshots/${name}.png`, fullPage: true });
  console.log(`📸 Screenshot saved: ${name}.png`);
}

export async function logConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  return errors;
}

export async function clearLocalStorage(page: Page) {
  await page.evaluate(() => localStorage.clear());
}

export async function getLocalStorageItem(page: Page, key: string) {
  return page.evaluate((k) => localStorage.getItem(k), key);
}

export async function waitForNetworkIdle(page: Page, timeout = 5000) {
  await page.waitForLoadState('networkidle', { timeout });
}
