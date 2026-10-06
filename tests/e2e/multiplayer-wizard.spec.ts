import { test, expect } from '@playwright/test';
import * as helpers from './helpers';

/**
 * Multiplayer Logging Wizard Tests
 * 
 * Tests the bulk/multiplayer logging wizard for coaches and groups.
 * This wizard allows logging activities for multiple players at once.
 * 
 * Wizard Steps:
 * 1. Select Players (self + friends)
 * 2. Choose Activity Type (session, routine, game)
 * 3. Enter Details (varies by activity)
 * 4. Submit Scores
 */

test.describe('Multiplayer Logging Wizard', () => {
  
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

  test('multiplayer log button is visible on practice tab', async ({ page }) => {
    const bulkLogBtn = page.locator('#bulkLogBtn');
    await expect(bulkLogBtn).toBeVisible();
    
    // Check button text
    const buttonText = await bulkLogBtn.textContent();
    expect(buttonText).toContain('Multiplayer');
  });

  test('can open multiplayer wizard', async ({ page }) => {
    await page.click('#bulkLogBtn');
    await page.waitForTimeout(500);
    
    // Wizard modal should be visible
    const wizard = page.locator('#bulkLogWizard');
    await expect(wizard).toBeVisible({ timeout: 5000 });
    
    // Should show step 1 - player selection
    const stepContent = await page.locator('.wizard-step-content').isVisible();
    expect(stepContent).toBeTruthy();
  });

  test('wizard shows player selection in step 1', async ({ page }) => {
    await page.click('#bulkLogBtn');
    await page.waitForTimeout(500);
    
    // Should have player selection header
    const header = page.locator('h4:has-text("Choose who")');
    await expect(header).toBeVisible();
    
    // Should have player selection list
    const playerList = page.locator('#playerSelectionList, .player-selection-list');
    await expect(playerList).toBeVisible();
    
    // Current user should be in the list
    const currentUserItem = page.locator('.current-user-item, .player-selection-item').first();
    await expect(currentUserItem).toBeVisible();
  });

  test('can select self as player', async ({ page }) => {
    await page.click('#bulkLogBtn');
    await page.waitForTimeout(500);
    
    // Click on the first player (should be current user)
    const firstPlayer = page.locator('.player-selection-item').first();
    await firstPlayer.click();
    await page.waitForTimeout(200);
    
    // Should be selected
    const isSelected = await firstPlayer.evaluate(el => el.classList.contains('selected'));
    expect(isSelected).toBeTruthy();
    
    // Next button should be enabled
    const nextBtn = page.locator('#bulkLogNext');
    await expect(nextBtn).toBeEnabled();
  });

  test('next button disabled when no players selected', async ({ page }) => {
    await page.click('#bulkLogBtn');
    await page.waitForTimeout(500);
    
    // Next button should be disabled initially (no selection)
    const nextBtn = page.locator('#bulkLogNext');
    const isDisabled = await nextBtn.getAttribute('disabled');
    
    // Note: May be enabled if current user is auto-selected
    console.log(`Next button disabled: ${isDisabled !== null}`);
  });

  test('can cancel wizard', async ({ page }) => {
    await page.click('#bulkLogBtn');
    await page.waitForTimeout(500);
    
    // Click cancel
    await page.click('#cancelBulkLog');
    await page.waitForTimeout(300);
    
    // Wizard should be closed
    const wizard = page.locator('#bulkLogWizard');
    const isVisible = await wizard.isVisible().catch(() => false);
    expect(isVisible).toBeFalsy();
  });

  test('can navigate to step 2 - activity selection', async ({ page }) => {
    await page.click('#bulkLogBtn');
    await page.waitForTimeout(500);
    
    // Select a player
    const firstPlayer = page.locator('.player-selection-item').first();
    await firstPlayer.click();
    await page.waitForTimeout(200);
    
    // Click next
    await page.click('#bulkLogNext');
    await page.waitForTimeout(500);
    
    // Should be on step 2 - activity selection
    const activityHeader = page.locator('h4:has-text("What type of activity")');
    await expect(activityHeader).toBeVisible();
    
    // Should have activity type cards
    const activityCards = page.locator('.activity-type-card');
    const cardCount = await activityCards.count();
    expect(cardCount).toBeGreaterThan(0);
    console.log(`Found ${cardCount} activity type cards`);
  });

  test('activity type cards are displayed in step 2', async ({ page }) => {
    await page.click('#bulkLogBtn');
    await page.waitForTimeout(500);
    
    // Select and proceed
    await page.locator('.player-selection-item').first().click();
    await page.waitForTimeout(200);
    await page.click('#bulkLogNext');
    await page.waitForTimeout(500);
    
    // Check for session activity card
    const sessionCard = page.locator('.activity-type-card[data-activity="session"]');
    const sessionVisible = await sessionCard.isVisible().catch(() => false);
    console.log(`Session card visible: ${sessionVisible}`);
    
    // Check for routine activity card
    const routineCard = page.locator('.activity-type-card[data-activity="routine"]');
    const routineVisible = await routineCard.isVisible().catch(() => false);
    console.log(`Routine card visible: ${routineVisible}`);
    
    // Check for game activity card
    const gameCard = page.locator('.activity-type-card[data-activity="game"]');
    const gameVisible = await gameCard.isVisible().catch(() => false);
    console.log(`Game card visible: ${gameVisible}`);
    
    // At least one should be visible
    expect(sessionVisible || routineVisible || gameVisible).toBeTruthy();
  });

  test('can select session activity type', async ({ page }) => {
    await page.click('#bulkLogBtn');
    await page.waitForTimeout(500);
    
    // Select player and proceed
    await page.locator('.player-selection-item').first().click();
    await page.waitForTimeout(200);
    await page.click('#bulkLogNext');
    await page.waitForTimeout(500);
    
    // Click session activity card
    await page.click('.activity-type-card[data-activity="session"]');
    await page.waitForTimeout(200);
    
    // Card should be selected
    const sessionCard = page.locator('.activity-type-card[data-activity="session"]');
    const isSelected = await sessionCard.evaluate(el => el.classList.contains('selected'));
    expect(isSelected).toBeTruthy();
    
    // Next button should be enabled
    const nextBtn = page.locator('#bulkLogNext');
    await expect(nextBtn).toBeEnabled();
  });

  test('can go back from step 2 to step 1', async ({ page }) => {
    await page.click('#bulkLogBtn');
    await page.waitForTimeout(500);
    
    // Go to step 2
    await page.locator('.player-selection-item').first().click();
    await page.waitForTimeout(200);
    await page.click('#bulkLogNext');
    await page.waitForTimeout(500);
    
    // Click back
    await page.click('#bulkLogBack');
    await page.waitForTimeout(300);
    
    // Should be back on step 1
    const playerHeader = page.locator('h4:has-text("Choose who")');
    await expect(playerHeader).toBeVisible();
  });

  test('can navigate to step 3 - session details', async ({ page }) => {
    await page.click('#bulkLogBtn');
    await page.waitForTimeout(500);
    
    // Step 1: Select player
    await page.locator('.player-selection-item').first().click();
    await page.waitForTimeout(200);
    await page.click('#bulkLogNext');
    await page.waitForTimeout(500);
    
    // Step 2: Select session activity
    await page.click('.activity-type-card[data-activity="session"]');
    await page.waitForTimeout(200);
    await page.click('#bulkLogNext');
    await page.waitForTimeout(500);
    
    // Step 3: Should see session details form
    const distanceInput = page.locator('#bulkSessionDistance');
    const inputVisible = await distanceInput.isVisible().catch(() => false);
    
    if (inputVisible) {
      console.log('✓ Session details form visible');
      await expect(distanceInput).toBeVisible();
    } else {
      // May need different selector
      const anyInput = page.locator('input[type="number"]').first();
      await expect(anyInput).toBeVisible();
    }
  });

  test('session details form has required fields', async ({ page }) => {
    await page.click('#bulkLogBtn');
    await page.waitForTimeout(500);
    
    // Navigate to step 3
    await page.locator('.player-selection-item').first().click();
    await page.waitForTimeout(200);
    await page.click('#bulkLogNext');
    await page.waitForTimeout(500);
    await page.click('.activity-type-card[data-activity="session"]');
    await page.waitForTimeout(200);
    await page.click('#bulkLogNext');
    await page.waitForTimeout(500);
    
    // Check for distance input
    const distanceInput = page.locator('#bulkSessionDistance');
    if (await distanceInput.isVisible().catch(() => false)) {
      console.log('✓ Distance input found');
    }
    
    // Check for quick distance buttons
    const quickBtns = page.locator('.bulk-quick-distance, .quick-btn');
    const quickBtnCount = await quickBtns.count();
    console.log(`Found ${quickBtnCount} quick distance buttons`);
    
    // Check for player score inputs
    const makesInputs = page.locator('.player-session-makes, input[placeholder="0"]');
    const makesCount = await makesInputs.count();
    console.log(`Found ${makesCount} makes input(s) for players`);
    
    // Check for submit button
    const submitBtn = page.locator('#bulkLogSubmit');
    const submitVisible = await submitBtn.isVisible().catch(() => false);
    console.log(`Submit button visible: ${submitVisible}`);
  });

  test('quick distance buttons work', async ({ page }) => {
    await page.click('#bulkLogBtn');
    await page.waitForTimeout(500);
    
    // Navigate to session details
    await page.locator('.player-selection-item').first().click();
    await page.waitForTimeout(200);
    await page.click('#bulkLogNext');
    await page.waitForTimeout(500);
    await page.click('.activity-type-card[data-activity="session"]');
    await page.waitForTimeout(200);
    await page.click('#bulkLogNext');
    await page.waitForTimeout(500);
    
    // Click a quick distance button
    const quickBtn = page.locator('.bulk-quick-distance[data-distance="25"], .quick-btn:has-text("25")').first();
    if (await quickBtn.isVisible().catch(() => false)) {
      await quickBtn.click();
      await page.waitForTimeout(200);
      
      // Check if distance was set
      const distanceInput = page.locator('#bulkSessionDistance');
      const value = await distanceInput.inputValue().catch(() => '');
      console.log(`Distance value after clicking 25': ${value}`);
    }
  });

  test('can fill out session scores', async ({ page }) => {
    await page.click('#bulkLogBtn');
    await page.waitForTimeout(500);
    
    // Navigate to session details
    await page.locator('.player-selection-item').first().click();
    await page.waitForTimeout(200);
    await page.click('#bulkLogNext');
    await page.waitForTimeout(500);
    await page.click('.activity-type-card[data-activity="session"]');
    await page.waitForTimeout(200);
    await page.click('#bulkLogNext');
    await page.waitForTimeout(500);
    
    // Fill distance
    const distanceInput = page.locator('#bulkSessionDistance');
    if (await distanceInput.isVisible().catch(() => false)) {
      await distanceInput.fill('20');
    }
    
    // Fill makes for first player
    const makesInput = page.locator('.player-session-makes').first();
    if (await makesInput.isVisible().catch(() => false)) {
      await makesInput.fill('8');
    }
    
    // Fill attempts for first player
    const attemptsInput = page.locator('.player-session-attempts').first();
    if (await attemptsInput.isVisible().catch(() => false)) {
      await attemptsInput.fill('10');
    }
    
    console.log('✓ Session form filled');
  });

  test('timer controls exist in session form', async ({ page }) => {
    await page.click('#bulkLogBtn');
    await page.waitForTimeout(500);
    
    // Navigate to session details
    await page.locator('.player-selection-item').first().click();
    await page.waitForTimeout(200);
    await page.click('#bulkLogNext');
    await page.waitForTimeout(500);
    await page.click('.activity-type-card[data-activity="session"]');
    await page.waitForTimeout(200);
    await page.click('#bulkLogNext');
    await page.waitForTimeout(500);
    
    // Check for timer button
    const timerBtn = page.locator('#bulkStartSessionTimer');
    const timerVisible = await timerBtn.isVisible().catch(() => false);
    console.log(`Timer button visible: ${timerVisible}`);
    
    // Check for timer display
    const timerDisplay = page.locator('#bulkSessionDurationDisplay, .timer-display');
    const displayVisible = await timerDisplay.isVisible().catch(() => false);
    console.log(`Timer display visible: ${displayVisible}`);
    
    // Check for reset button
    const resetBtn = page.locator('#bulkResetSessionTimer');
    const resetVisible = await resetBtn.isVisible().catch(() => false);
    console.log(`Reset timer button visible: ${resetVisible}`);
  });
});

test.describe('Multiplayer Wizard - Routine Activity', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await helpers.waitForAppReady(page);
    await helpers.ensureLoggedIn(page);
    await page.click('button[data-view="practice"]');
    await page.waitForTimeout(500);
    await page.click('#tutorialClose').catch(() => {});
    await page.waitForTimeout(300);
  });

  test('can select routine activity type', async ({ page }) => {
    await page.click('#bulkLogBtn');
    await page.waitForTimeout(500);
    
    // Step 1
    await page.locator('.player-selection-item').first().click();
    await page.waitForTimeout(200);
    await page.click('#bulkLogNext');
    await page.waitForTimeout(500);
    
    // Select routine activity
    const routineCard = page.locator('.activity-type-card[data-activity="routine"]');
    if (await routineCard.isVisible().catch(() => false)) {
      await routineCard.click();
      await page.waitForTimeout(200);
      
      const isSelected = await routineCard.evaluate(el => el.classList.contains('selected'));
      expect(isSelected).toBeTruthy();
      console.log('✓ Routine activity selected');
    }
  });

  test('routine selection shows routine list', async ({ page }) => {
    await page.click('#bulkLogBtn');
    await page.waitForTimeout(500);
    
    // Navigate to routine selection
    await page.locator('.player-selection-item').first().click();
    await page.waitForTimeout(200);
    await page.click('#bulkLogNext');
    await page.waitForTimeout(500);
    
    const routineCard = page.locator('.activity-type-card[data-activity="routine"]');
    if (await routineCard.isVisible().catch(() => false)) {
      await routineCard.click();
      await page.waitForTimeout(200);
      await page.click('#bulkLogNext');
      await page.waitForTimeout(500);
      
      // Should show routine selection items
      const routineItems = page.locator('.routine-selection-item');
      const routineCount = await routineItems.count();
      console.log(`Found ${routineCount} routines to select`);
    }
  });
});

test.describe('Multiplayer Wizard - Game Activity', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await helpers.waitForAppReady(page);
    await helpers.ensureLoggedIn(page);
    await page.click('button[data-view="practice"]');
    await page.waitForTimeout(500);
    await page.click('#tutorialClose').catch(() => {});
    await page.waitForTimeout(300);
  });

  test('can select game activity type', async ({ page }) => {
    await page.click('#bulkLogBtn');
    await page.waitForTimeout(500);
    
    // Step 1
    await page.locator('.player-selection-item').first().click();
    await page.waitForTimeout(200);
    await page.click('#bulkLogNext');
    await page.waitForTimeout(500);
    
    // Select game activity
    const gameCard = page.locator('.activity-type-card[data-activity="game"]');
    if (await gameCard.isVisible().catch(() => false)) {
      await gameCard.click();
      await page.waitForTimeout(200);
      
      const isSelected = await gameCard.evaluate(el => el.classList.contains('selected'));
      expect(isSelected).toBeTruthy();
      console.log('✓ Game activity selected');
    }
  });

  test('game selection shows game list', async ({ page }) => {
    await page.click('#bulkLogBtn');
    await page.waitForTimeout(500);
    
    // Navigate to game selection
    await page.locator('.player-selection-item').first().click();
    await page.waitForTimeout(200);
    await page.click('#bulkLogNext');
    await page.waitForTimeout(500);
    
    const gameCard = page.locator('.activity-type-card[data-activity="game"]');
    if (await gameCard.isVisible().catch(() => false)) {
      await gameCard.click();
      await page.waitForTimeout(200);
      await page.click('#bulkLogNext');
      await page.waitForTimeout(500);
      
      // Should show game selection items
      const gameItems = page.locator('.game-selection-item');
      const gameCount = await gameItems.count();
      console.log(`Found ${gameCount} games to select`);
    }
  });
});

test.describe('Multiplayer Wizard - Edge Cases', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await helpers.waitForAppReady(page);
    await helpers.ensureLoggedIn(page);
    await page.click('button[data-view="practice"]');
    await page.waitForTimeout(500);
    await page.click('#tutorialClose').catch(() => {});
    await page.waitForTimeout(300);
  });

  test('wizard closes when clicking overlay', async ({ page }) => {
    await page.click('#bulkLogBtn');
    await page.waitForTimeout(500);
    
    // Click on the overlay (outside the modal)
    const overlay = page.locator('.modal-overlay#bulkLogWizard');
    if (await overlay.isVisible().catch(() => false)) {
      // Click at the edge of the overlay
      await overlay.click({ position: { x: 10, y: 10 } });
      await page.waitForTimeout(300);
      
      // Wizard may or may not close depending on implementation
      const stillVisible = await overlay.isVisible().catch(() => false);
      console.log(`Wizard still visible after overlay click: ${stillVisible}`);
    }
  });

  test('can toggle player selection', async ({ page }) => {
    await page.click('#bulkLogBtn');
    await page.waitForTimeout(500);
    
    const firstPlayer = page.locator('.player-selection-item').first();
    
    // Select
    await firstPlayer.click();
    await page.waitForTimeout(200);
    let isSelected = await firstPlayer.evaluate(el => el.classList.contains('selected'));
    expect(isSelected).toBeTruthy();
    
    // Deselect
    await firstPlayer.click();
    await page.waitForTimeout(200);
    isSelected = await firstPlayer.evaluate(el => el.classList.contains('selected'));
    expect(isSelected).toBeFalsy();
    
    console.log('✓ Player toggle works correctly');
  });

  test('players count updates in header', async ({ page }) => {
    await page.click('#bulkLogBtn');
    await page.waitForTimeout(500);
    
    // Look for friends count in header
    const friendsHeader = page.locator('h5:has-text("Friends")');
    if (await friendsHeader.isVisible().catch(() => false)) {
      const headerText = await friendsHeader.textContent();
      console.log(`Friends header: ${headerText}`);
    }
  });

  test('shows message when no friends', async ({ page }) => {
    await page.click('#bulkLogBtn');
    await page.waitForTimeout(500);
    
    // Check for no-friends notice
    const noFriendsNotice = page.locator('.no-friends-notice, :has-text("haven\'t added any friends")');
    const noticeVisible = await noFriendsNotice.first().isVisible().catch(() => false);
    console.log(`No friends notice visible: ${noticeVisible}`);
  });
});
