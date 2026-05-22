import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

async function expectNoPageOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => ({
    x: Math.ceil(document.documentElement.scrollWidth - window.innerWidth),
    y: Math.ceil(document.documentElement.scrollHeight - window.innerHeight),
    bodyY: Math.ceil(document.body.scrollHeight - window.innerHeight)
  }));

  expect(overflow.x).toBeLessThanOrEqual(1);
  expect(Math.max(overflow.y, overflow.bodyY)).toBeLessThanOrEqual(1);
}

test.describe("mobile viewport", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("keeps the full play surface in one screen", async ({ page }) => {
    await page.goto("/");

    const board = page.getByRole("grid", { name: "Sudoku board" });
    const digitOne = page.getByRole("button", { name: "Input 1" });
    const digitNine = page.getByRole("button", { name: "Input 9" });
    const notesSwitch = page.getByRole("switch", { name: "Notes" });

    await expect(board).toBeVisible();
    await expect(board).toBeInViewport();
    await expect(digitOne).toBeInViewport();
    await expect(digitNine).toBeInViewport();
    await expect(notesSwitch).toBeInViewport();
    await expectNoPageOverflow(page);

    await notesSwitch.click();
    await expect(notesSwitch).toHaveAttribute("aria-checked", "true");
    await expect(board).toBeInViewport();
    await expect(page.getByRole("button", { name: "Toggle note 1" })).toBeInViewport();
    await expectNoPageOverflow(page);
  });
});

test.describe("desktop viewport", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test("keeps the board and controls playable without page scroll", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("grid", { name: "Sudoku board" })).toBeInViewport();
    await expect(page.getByRole("button", { name: "New Game" })).toBeInViewport();
    await expect(page.getByRole("button", { name: "Input 9" })).toBeInViewport();
    await expectNoPageOverflow(page);
  });
});
