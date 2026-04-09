import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

test("keeps the mobile keypad and board interactions visible", async ({ page }) => {
  await page.goto("/");

  const board = page.getByRole("grid", { name: "Sudoku 棋盘" });
  const digitOne = page.getByRole("button", { name: "输入数字 1" });
  const peerSwitch = page.getByRole("switch", { name: /占线高亮/ });

  await expect(board).toBeVisible();
  await expect(digitOne).toBeInViewport();
  await expect(peerSwitch).toBeInViewport();

  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(hasHorizontalOverflow).toBe(false);

  await peerSwitch.click();
  await expect(peerSwitch).toHaveAttribute("aria-checked", "false");
  await expect(board).toBeInViewport();
  await expect(digitOne).toBeInViewport();
});
