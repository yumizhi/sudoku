import { expect, test } from "@playwright/test";

test("renders the game shell and supports basic input flow", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1, name: "Sudoku" })).toBeAttached();
  await expect(page.getByRole("grid", { name: "Sudoku board" })).toBeVisible();
  await expect(page.locator('[role="gridcell"]')).toHaveCount(81);
  await expect(page.getByRole("switch", { name: "Notes" })).toHaveAttribute("aria-checked", "false");

  await page.getByRole("button", { name: "Input 1" }).click();
  await expect(page.getByRole("status")).toHaveText("Entered 1.");

  await page.getByRole("button", { name: "中" }).click();
  await expect(page.getByRole("button", { name: "新游戏" })).toBeVisible();
  await expect(page.getByRole("button", { name: "输入数字 1" })).toBeVisible();

  await page.getByRole("button", { name: "困难" }).click();
  const dialog = page.getByRole("dialog", { name: "切换难度？" });
  await expect(dialog).toContainText("切换到困难会开始一局新游戏");
  await page.getByRole("button", { name: "取消" }).click();
  await expect(dialog).toBeHidden();
});
