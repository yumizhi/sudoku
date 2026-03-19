import { expect, test } from "@playwright/test";

test("renders the game shell and supports basic input flow", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1, name: "数独" })).toBeVisible();
  await expect(page.getByText(/新游戏已开始|已恢复上次进度|已恢复教程进度/)).toBeVisible();
  await expect(page.getByRole("grid", { name: "Sudoku 棋盘" })).toBeVisible();
  await expect(page.locator('[role="gridcell"]')).toHaveCount(81);
  await expect(page.getByRole("switch", { name: /占线高亮/ })).toHaveAttribute("aria-checked", "true");

  await page.getByRole("button", { name: "输入数字 1" }).click();
  await expect(page.getByText("已填入 1。")).toBeVisible();
});
