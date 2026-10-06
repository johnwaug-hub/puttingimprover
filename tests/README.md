# Putting Improver E2E Tests

Automated end-to-end testing suite using [Playwright](https://playwright.dev/).

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
npx playwright install
```

### 2. Set Environment Variables (Optional)

For authenticated tests, set your test credentials:

```bash
# For email/password auth
export TEST_EMAIL="waugstest@gmail.com"
export TEST_PASSWORD="your-test-password"

# For Google OAuth (more complex)
export GOOGLE_EMAIL="your-google-email"
export GOOGLE_PASSWORD="your-google-password"
```

### 3. Run Tests

```bash
# Run all tests (headless)
npm test

# Run with browser visible
npm run test:headed

# Run with Playwright UI
npm run test:ui

# Run in debug mode
npm run test:debug

# Run specific browser
npm run test:chromium
npm run test:mobile

# View test report
npm run test:report
```

## 📁 Test Structure

```
tests/
├── e2e/
│   ├── auth.setup.ts      # Authentication setup (runs first)
│   ├── helpers.ts         # Shared test utilities
│   ├── app.spec.ts        # Full app tests
│   ├── practice.spec.ts   # Practice tab tests
│   ├── games.spec.ts      # Games tab tests
│   └── achievements.spec.ts # Achievements & challenges tests
├── .auth/                 # Saved auth state (gitignored)
├── screenshots/           # Failure screenshots
├── results/               # Test artifacts
└── reports/               # HTML test reports
```

## 🧪 Test Coverage

### App Loading & Navigation
- ✅ App loads successfully
- ✅ User authentication
- ✅ Tab navigation
- ✅ Mobile responsiveness

### Practice Tab
- ✅ Session logging
- ✅ Input validation
- ✅ Distance presets
- ✅ Built-in routines
- ✅ Custom routines
- ✅ Community routines
- ✅ Bulk logging

### Games Tab
- ✅ All 10 games available
- ✅ Game start/play/finish flow
- ✅ Score tracking
- ✅ Game history

### Stats Tab
- ✅ Statistics display
- ✅ Charts rendering
- ✅ Achievements view
- ✅ Streak information

### Community Tab
- ✅ Points leaderboard
- ✅ ELO leaderboard
- ✅ Season leaderboard
- ✅ User highlighting

### Challenges
- ✅ Daily challenge display
- ✅ Weekly challenge display
- ✅ Progress tracking
- ✅ Reward display

### Achievements
- ✅ Achievement categories
- ✅ Lock/unlock status
- ✅ Points display
- ✅ Progress tracking

## 🔧 Configuration

Edit `playwright.config.ts` to customize:

- **Base URL**: Default is `https://puttingimprover.com`
- **Browsers**: Chrome, Firefox, Mobile Chrome, Mobile Safari
- **Timeouts**: Action (15s), Navigation (30s), Test (120s)
- **Retries**: 0 local, 2 on CI
- **Workers**: 1 (sequential for Firebase)

## 📝 Writing New Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';
import * as helpers from './helpers';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await helpers.waitForAppReady(page);
  });

  test('should do something', async ({ page }) => {
    // Arrange
    await helpers.navigateToTab(page, 'practice');
    
    // Act
    await page.click('button:has-text("Add Session")');
    
    // Assert
    await helpers.expectVisible(page, '.modal');
  });
});
```

### Helper Functions

```typescript
// Navigation
await helpers.navigateToTab(page, 'practice');
await helpers.waitForAppReady(page);

// Practice
await helpers.addPracticeSession(page, { distance: 15, makes: 8, attempts: 10 });
await helpers.startRoutine(page, 'Beginner 10ft');

// Games
await helpers.startGame(page, 'Around the World');
await helpers.playGameRound(page, true); // make
await helpers.finishGame(page);

// Stats
await helpers.viewAchievements(page);
await helpers.openCharts(page);

// Community
await helpers.viewLeaderboard(page, 'points');
await helpers.searchFriend(page, 'John');

// Assertions
await helpers.expectVisible(page, '.selector');
await helpers.expectText(page, '.selector', 'expected text');
```

## 🐛 Debugging Tips

1. **Use Debug Mode**: `npm run test:debug`
2. **Add Screenshots**: `await helpers.takeScreenshot(page, 'debug-step')`
3. **Check Console**: `const errors = await helpers.logConsoleErrors(page)`
4. **Slow Down**: Add `await page.waitForTimeout(1000)` between steps
5. **View Trace**: Check `tests/results` for trace files

## 🔐 Authentication Notes

The test suite supports multiple authentication methods:

1. **Email/Password**: Set `TEST_EMAIL` and `TEST_PASSWORD` environment variables
2. **Google OAuth**: More complex, requires handling popup flow
3. **Pre-authenticated Session**: Export auth state from browser DevTools

For best results with Firebase Auth:
- Use a dedicated test account
- Consider using Firebase Auth Emulator for local testing

## 📊 CI/CD Integration

Add to your CI workflow:

```yaml
# .github/workflows/e2e.yml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm test
        env:
          TEST_EMAIL: ${{ secrets.TEST_EMAIL }}
          TEST_PASSWORD: ${{ secrets.TEST_PASSWORD }}
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results
          path: tests/results/
```

## 🔄 Regular Testing Workflow

1. **Before Deploy**: Run full test suite
2. **After Deploy**: Run smoke tests
3. **Daily**: Automated CI runs
4. **On Bug Reports**: Add regression test

## 📈 Extending Tests

To add tests for new features:

1. Create new spec file or add to existing
2. Add helper functions if needed
3. Follow existing patterns
4. Run and verify locally
5. Check coverage report

---

**Need Help?** Check Playwright docs at https://playwright.dev/docs/intro
