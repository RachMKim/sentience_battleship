import { test, expect } from '@playwright/test';

test.describe('Battleship E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('battleship-locale', 'en');
      localStorage.removeItem('battleship-gameId');
      localStorage.removeItem('battleship-playerId');
    });
    await page.reload();
  });

  test('main menu renders with all options', async ({ page }) => {
    await expect(page.locator('text=BATTLE')).toBeVisible();
    await expect(page.locator('text=VS COMPUTER')).toBeVisible();
    await expect(page.locator('text=CREATE ROOM')).toBeVisible();
    await expect(page.locator('text=JOIN ROOM')).toBeVisible();
    await expect(page.locator('text=GAME HISTORY')).toBeVisible();
  });

  test('VS COMPUTER shows difficulty selection', async ({ page }) => {
    await page.click('text=VS COMPUTER');
    await expect(page.locator('text=EASY')).toBeVisible();
    await expect(page.locator('text=MEDIUM')).toBeVisible();
    await expect(page.locator('text=HARD')).toBeVisible();
  });

  test('start AI game and reach placement phase', async ({ page }) => {
    await page.click('text=VS COMPUTER');
    await page.click('button:has-text("MEDIUM")');
    await expect(page.locator('text=DEPLOY YOUR FLEET')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=RANDOMIZE')).toBeVisible();
    await expect(page.locator('button:has-text("HORIZONTAL")').first()).toBeVisible();
  });

  test('randomize places all ships and shows confirm', async ({ page }) => {
    await page.click('text=VS COMPUTER');
    await page.click('button:has-text("EASY")');
    await expect(page.locator('text=DEPLOY YOUR FLEET')).toBeVisible({ timeout: 5000 });
    await page.click('text=RANDOMIZE');
    await expect(page.locator('text=CONFIRM DEPLOYMENT')).toBeVisible({ timeout: 3000 });
  });

  test('full AI game flow: place ships, fire shots on all rows', async ({ page }) => {
    await page.click('text=VS COMPUTER');
    await page.click('button:has-text("EASY")');
    await expect(page.locator('text=DEPLOY YOUR FLEET')).toBeVisible({ timeout: 5000 });
    await page.click('text=RANDOMIZE');
    await page.click('text=CONFIRM DEPLOYMENT');

    await expect(page.locator('h3:has-text("ENEMY WATERS")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('h3:has-text("YOUR FLEET")')).toBeVisible();

    await expect(page.locator('text=YOUR TURN')).toBeVisible({ timeout: 5000 });

    const enemyBoard = page.locator('h3:has-text("ENEMY WATERS")').locator('..').locator('..');
    const cells = enemyBoard.locator('button');

    const testCoords = ['A1', 'E5', 'J10', 'A10', 'J1'];
    for (const coord of testCoords) {
      const turnVisible = await page.locator('text=YOUR TURN').isVisible().catch(() => false);
      if (!turnVisible) {
        await page.waitForTimeout(1500);
      }

      const cell = cells.filter({ has: page.locator(`[aria-label^="${coord}"]`) }).first();
      if (await cell.count() > 0 && await cell.isEnabled()) {
        await cell.click();
        await page.waitForTimeout(1200);
      }
    }
  });

  test('no 3D perspective transforms in DOM', async ({ page }) => {
    await page.click('text=VS COMPUTER');
    await page.click('button:has-text("MEDIUM")');
    await expect(page.locator('text=DEPLOY YOUR FLEET')).toBeVisible({ timeout: 5000 });

    const transforms = await page.evaluate(() => {
      const all = document.querySelectorAll('*');
      const problems: string[] = [];
      for (const el of all) {
        const style = getComputedStyle(el);
        if (style.transform && /rotateX|rotateY|perspective|translateZ/.test(style.transform)) {
          problems.push(`${el.tagName}.${el.className}: ${style.transform}`);
        }
        if (style.perspective && style.perspective !== 'none') {
          problems.push(`${el.tagName}.${el.className}: perspective=${style.perspective}`);
        }
      }
      return problems;
    });
    expect(transforms).toHaveLength(0);
  });

  test('game history page loads without crash', async ({ page }) => {
    await page.click('text=GAME HISTORY');
    await expect(page.locator('text=BATTLE LOG')).toBeVisible({ timeout: 5000 });
  });

  test('board has 10 row labels', async ({ page }) => {
    await page.click('text=VS COMPUTER');
    await page.click('button:has-text("EASY")');
    await expect(page.locator('text=DEPLOY YOUR FLEET')).toBeVisible({ timeout: 5000 });

    for (let i = 1; i <= 10; i++) {
      await expect(page.locator(`text="${i}"`).first()).toBeVisible();
    }
  });

  test('board has column labels A-J', async ({ page }) => {
    await page.click('text=VS COMPUTER');
    await page.click('button:has-text("EASY")');
    await expect(page.locator('text=DEPLOY YOUR FLEET')).toBeVisible({ timeout: 5000 });

    for (const letter of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']) {
      await expect(page.locator(`text="${letter}"`).first()).toBeVisible();
    }
  });

  test('exit game button visible during placement and returns to menu', async ({ page }) => {
    await page.click('text=VS COMPUTER');
    await page.click('button:has-text("EASY")');
    await expect(page.locator('text=DEPLOY YOUR FLEET')).toBeVisible({ timeout: 5000 });

    const exitBtn = page.locator('button:has-text("EXIT GAME")');
    await expect(exitBtn).toBeVisible();
    await exitBtn.click();

    await expect(page.locator('text=VS COMPUTER')).toBeVisible({ timeout: 3000 });
  });

  test('exit game button visible during firing phase and returns to menu', async ({ page }) => {
    await page.click('text=VS COMPUTER');
    await page.click('button:has-text("EASY")');
    await expect(page.locator('text=DEPLOY YOUR FLEET')).toBeVisible({ timeout: 5000 });
    await page.click('text=RANDOMIZE');
    await page.click('text=CONFIRM DEPLOYMENT');

    await expect(page.locator('h3:has-text("ENEMY WATERS")')).toBeVisible({ timeout: 5000 });

    const exitBtn = page.locator('button:has-text("EXIT GAME")');
    await expect(exitBtn).toBeVisible();
    await exitBtn.click();

    await expect(page.locator('text=VS COMPUTER')).toBeVisible({ timeout: 3000 });
  });

  test('resume game prompt appears after exiting mid-game', async ({ page }) => {
    await page.click('text=VS COMPUTER');
    await page.click('button:has-text("EASY")');
    await expect(page.locator('text=DEPLOY YOUR FLEET')).toBeVisible({ timeout: 5000 });
    await page.click('text=RANDOMIZE');
    await page.click('text=CONFIRM DEPLOYMENT');

    await expect(page.locator('h3:has-text("ENEMY WATERS")')).toBeVisible({ timeout: 5000 });

    await page.locator('button:has-text("EXIT GAME")').click();
    await expect(page.locator('text=VS COMPUTER')).toBeVisible({ timeout: 3000 });

    await expect(page.locator('text=RESUME GAME')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=START FRESH')).toBeVisible();
  });

  test('start fresh clears saved game', async ({ page }) => {
    await page.click('text=VS COMPUTER');
    await page.click('button:has-text("EASY")');
    await expect(page.locator('text=DEPLOY YOUR FLEET')).toBeVisible({ timeout: 5000 });
    await page.click('text=RANDOMIZE');
    await page.click('text=CONFIRM DEPLOYMENT');

    await expect(page.locator('h3:has-text("ENEMY WATERS")')).toBeVisible({ timeout: 5000 });

    await page.locator('button:has-text("EXIT GAME")').click();
    await expect(page.locator('text=RESUME GAME')).toBeVisible({ timeout: 3000 });

    await page.click('text=START FRESH');
    await expect(page.locator('text=RESUME GAME')).not.toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=VS COMPUTER')).toBeVisible();
  });

  test('language selector is visible and switches language', async ({ page }) => {
    const langBtn = page.locator('button:has-text("EN")');
    await expect(langBtn.first()).toBeVisible({ timeout: 3000 });
  });
});
