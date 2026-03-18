import { expect, test } from "@playwright/test";

test("opens hint explanation as a dialog before applying the move", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "提示" }).click();
  await expect(page.getByRole("dialog", { name: "提示解释" })).toBeVisible();
  await expect(page.getByRole("button", { name: "应用这一步" })).toBeVisible();
});
