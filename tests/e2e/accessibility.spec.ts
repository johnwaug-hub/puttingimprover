import { test, expect } from '@playwright/test';
import * as helpers from './helpers';

// Try to import axe-core, skip tests if not available
let AxeBuilder: any = null;
try {
  AxeBuilder = require('@axe-core/playwright').default;
} catch {
  // Package not installed
}

/**
 * Accessibility Tests
 * 
 * Uses axe-core to check for WCAG violations.
 * Color contrast violations are logged as warnings, not failures.
 */

test.describe('♿ Accessibility', () => {
  
  test.beforeEach(async ({ page }) => {
    if (!AxeBuilder) {
      test.skip();
      return;
    }
    await page.goto('/');
    await helpers.waitForAppReady(page);
    await helpers.ensureLoggedIn(page);
  });

  test('Practice tab has no critical a11y violations', async ({ page }) => {
    if (!AxeBuilder) { test.skip(); return; }
    
    // Click practice tab directly
    await page.click('button[data-view="practice"]').catch(() => {});
    await page.waitForTimeout(1000);
    
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    const critical = results.violations.filter((v: any) => 
      v.impact === 'critical' && v.id !== 'color-contrast'
    );
    
    const warnings = results.violations.filter((v: any) => v.id === 'color-contrast');
    if (warnings.length > 0) {
      console.log('⚠️ A11y warnings: color-contrast');
    }
    
    expect(critical).toHaveLength(0);
  });

  test('Games tab has no critical a11y violations', async ({ page }) => {
    if (!AxeBuilder) { test.skip(); return; }
    
    await page.click('button[data-view="games"]').catch(() => {});
    await page.waitForTimeout(1000);
    
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    const critical = results.violations.filter((v: any) => 
      v.impact === 'critical' && v.id !== 'color-contrast'
    );
    
    expect(critical).toHaveLength(0);
  });

  test('Stats tab has no critical a11y violations', async ({ page }) => {
    if (!AxeBuilder) { test.skip(); return; }
    
    await page.click('button[data-view="stats"]').catch(() => {});
    await page.waitForTimeout(1000);
    
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    const critical = results.violations.filter((v: any) => 
      v.impact === 'critical' && v.id !== 'color-contrast'
    );
    
    expect(critical).toHaveLength(0);
  });

  test('Community tab has no critical a11y violations', async ({ page }) => {
    if (!AxeBuilder) { test.skip(); return; }
    
    await page.click('button[data-view="leaderboard"]').catch(() => {});
    await page.waitForTimeout(1500);
    
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    const critical = results.violations.filter((v: any) => 
      v.impact === 'critical' && v.id !== 'color-contrast'
    );
    
    expect(critical).toHaveLength(0);
  });
});
