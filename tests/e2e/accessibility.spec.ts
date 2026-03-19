import { expect, test } from "@playwright/test";

test("supports keyboard navigation and exposes the peer-highlight switch", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("button", { name: "新游戏" })).toBeEnabled();

  const initialCell = page.locator('[role="gridcell"][aria-selected="true"]').first();
  await expect(initialCell).toBeFocused();
  const initialColumn = Number(await initialCell.getAttribute("aria-colindex"));

  await page.keyboard.press("ArrowRight");
  const nextCell = page.locator('[role="gridcell"][aria-selected="true"]').first();
  await expect(nextCell).toBeFocused();
  expect(Number(await nextCell.getAttribute("aria-colindex"))).not.toBe(initialColumn);

  const peerSwitch = page.getByRole("switch", { name: /占线高亮/ });
  await expect(peerSwitch).toHaveAttribute("aria-checked", "true");

  await peerSwitch.click();
  await expect(peerSwitch).toHaveAttribute("aria-checked", "false");
  await expect(page.getByText("已关闭占线高亮。")).toBeVisible();
});
