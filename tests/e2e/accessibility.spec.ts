import { expect, test } from "@playwright/test";

test("supports keyboard navigation and exposes the notes switch", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("button", { name: "New Game" })).toBeEnabled();

  const initialCell = page.locator('[role="gridcell"][aria-selected="true"]').first();
  await expect(initialCell).toBeFocused();
  const initialColumn = Number(await initialCell.getAttribute("aria-colindex"));

  await page.keyboard.press("ArrowRight");
  const nextCell = page.locator('[role="gridcell"][aria-selected="true"]').first();
  await expect(nextCell).toBeFocused();
  expect(Number(await nextCell.getAttribute("aria-colindex"))).not.toBe(initialColumn);

  const notesSwitch = page.getByRole("switch", { name: "Notes" });
  await expect(notesSwitch).toHaveAttribute("aria-checked", "false");

  await notesSwitch.click();
  await expect(notesSwitch).toHaveAttribute("aria-checked", "true");
  await expect(page.getByRole("status")).toHaveText("Notes mode on.");
});
