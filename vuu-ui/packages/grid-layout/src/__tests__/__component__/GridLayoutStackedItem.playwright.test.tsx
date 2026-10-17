import { expect, test } from "../../../../../playwright/fixtures";

const story = "GridLayout/StackedLayout/SingleStackedItemCustomTabs";

test("Stacked layout tabs can be selected and closed with Salt core", async ({
  mount,
  page,
}) => {
  await mount(story);

  const navyTab = page.getByRole("tab", { name: "Navy", exact: true });
  await navyTab.click();
  await expect(navyTab).toHaveAttribute("aria-selected", "true");

  await page
    .locator('.vuuDraggableItem[data-label="Red"]')
    .getByRole("button", { name: "Settings" })
    .click();
  await page.getByRole("menuitem", { name: "Close", exact: true }).click();

  await expect(page.getByRole("tab")).toHaveText(["Brown", "Navy", "Yellow"]);
  await expect(navyTab).toHaveAttribute("aria-selected", "true");
});

test("Dragging a stacked layout tab updates its rendered order and restores focus", async ({
  mount,
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await mount(story);

  const source = page.locator('.vuuDraggableItem[data-label="Brown"]');
  const target = page.locator('.vuuDraggableItem[data-label="Yellow"]');
  await expect(target).toBeVisible();

  const sourceBox = await source.boundingBox();
  if (!sourceBox) {
    throw new Error("The source tab must have layout bounds");
  }

  const sourceX = sourceBox.x + sourceBox.width / 2;
  const sourceY = sourceBox.y + sourceBox.height / 2;
  await page.mouse.move(sourceX, sourceY);
  await page.mouse.down();
  await page.mouse.move(sourceX + 10, sourceY, { steps: 5 });
  await expect(source).toHaveClass(/vuuDraggableItem-hidden/);
  await expect(page.locator(".SpaceMan")).toBeVisible();

  await target.hover();
  await target.hover();
  await expect(
    target.locator('xpath=following-sibling::*[@data-drop-target="true"]'),
  ).toBeVisible();
  await page.mouse.up();

  await expect(page.getByRole("tab")).toHaveText([
    "Navy",
    "Red",
    "Yellow",
    "Brown",
  ]);
  await expect(
    page.getByRole("tab", { name: "Brown", exact: true }),
  ).toBeFocused();
  expect(errors).toEqual([]);
});
