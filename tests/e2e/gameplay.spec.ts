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
  const dialog = page.getByRole("dialog", { name: "开始新游戏？" });
  await expect(dialog).toContainText("切换到困难会开始一局新游戏，当前棋盘会被清空。");
  await expect(dialog.getByRole("checkbox", { name: "下次不再提示" })).toBeVisible();
  await page.getByRole("button", { name: "取消" }).click();
  await expect(dialog).toBeHidden();

  await page.getByRole("button", { name: "新游戏" }).click();
  await expect(dialog).toContainText("这会开始一局新游戏，当前棋盘会被清空。");
  await page.getByRole("button", { name: "取消" }).click();
  await expect(dialog).toBeHidden();

  await page.getByRole("button", { name: "新游戏" }).click();
  await dialog.getByRole("checkbox", { name: "下次不再提示" }).check();
  await page.getByRole("button", { name: "确定" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("status")).toContainText("新游戏已开始");

  await page.getByRole("button", { name: "困难" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByRole("status")).toContainText("新游戏已开始（困难");
});
