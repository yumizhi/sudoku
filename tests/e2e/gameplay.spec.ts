import { expect, test } from "@playwright/test";

test("renders the game shell and supports basic input flow", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Sudoku Studio")).toBeVisible();
  await expect(page.getByText(/新游戏已开始|已恢复上次进度|已恢复教程进度/)).toBeVisible();
  await expect(page.getByRole("grid", { name: "Sudoku 棋盘" })).toBeVisible();
  await expect(page.locator('[role="gridcell"]')).toHaveCount(81);

  await page.getByRole("button", { name: /^1/ }).first().click();
  await expect(page.getByText(/已填入|这个位置暂时不正确/)).toBeVisible();
});
