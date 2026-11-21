import type { Locator, Page } from "@playwright/test";
import { expect, test } from "../../../../../playwright/fixtures";

const dockable = "VuuPortal/PanelsPalette/WorkspacesWithEdgeDocking";
const notDockable = "VuuPortal/PanelsPalette/WorkspacesWithPanelsPalette";

const box = async (locator: Locator) => {
  const result = await locator.boundingBox();
  if (!result) {
    throw Error("element has no bounding box");
  }
  return result;
};

/** The grid's box inside its padding. */
const contentBox = async (grid: Locator) => {
  const padding = await grid.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).paddingTop),
  );
  const { height, width, x, y } = await box(grid);
  return {
    bottom: y + height - padding,
    height: height - 2 * padding,
    right: x + width - padding,
    width: width - 2 * padding,
    x: x + padding,
    y: y + padding,
  };
};

/** Resolves once the grid's width has stopped changing. */
const settled = async (grid: Locator) => {
  let previous = Number.NaN;
  await expect
    .poll(async () => {
      const { width } = await box(grid);
      const stable = width === previous;
      previous = width;
      return stable;
    })
    .toBe(true);
};

/**
 * Expects `item` docked along the east edge of `grid`: flush with its right
 * edge, its full height, and a quarter of its width.
 */
const expectDockedEast = async (grid: Locator, item: Locator) => {
  await settled(grid);
  const content = await contentBox(grid);
  const docked = await box(item);
  expect(docked.x + docked.width).toBeCloseTo(content.right, 0);
  expect(docked.height).toBeCloseTo(content.height, 0);
  expect(docked.width / content.width).toBeGreaterThan(0.23);
  expect(docked.width / content.width).toBeLessThan(0.27);
};

/**
 * Presses on `source` and moves, in steps, to (x, y). The dock zones take
 * part from the dragover after the drag enters the grid. A browser keeps
 * sending dragover while the pointer rests, Playwright only on a move, so a
 * last small move stands in for that.
 */
const startDrag = async (page: Page, source: Locator, x: number, y: number) => {
  const { height, width, x: left, y: top } = await box(source);
  await page.mouse.move(left + width / 2, top + height / 2);
  await page.mouse.down();
  await page.mouse.move(left + width / 2 - 20, top + height / 2 + 20, {
    steps: 4,
  });
  await page.mouse.move(x, y, { steps: 10 });
  await page.mouse.move(x, y + 1);
};

/** The open workspace's grid. Its id is generated when the workspace opens. */
const workspaceGrid = (page: Page) =>
  page.locator(".vuuPortalWorkspace-grid > .vuuGridLayout");

/** Opens the Markets workspace and its Panels palette. */
const openMarkets = async (page: Page) => {
  await page.getByRole("link", { name: "Markets" }).click();
  const grid = workspaceGrid(page);
  await expect(grid.locator(".vuuGridLayoutItem")).toHaveCount(2);
  await page.getByRole("button", { exact: true, name: "Add panel" }).click();
  const row = page.locator(".vuuPanelsPalette-row", {
    hasText: "Order entry",
  });
  await expect(row).toBeVisible();
  // The context panel animates open, and the grid narrows with it: measure
  // once it has finished.
  await page
    .locator(".vuuContextPanel")
    .evaluate((element) =>
      Promise.all(
        element
          .getAnimations({ subtree: true })
          .map((animation) => animation.finished),
      ),
    );
  return { grid, row };
};

const orderEntry = (grid: Locator) =>
  grid.locator(".vuuGridLayoutItem", { hasText: "Single order ticket" });

test.describe("PortalWorkspace edge docking", () => {
  // The gallery root is 1600x900. In a smaller viewport the page scrolls,
  // and a drag near the viewport edge scrolls the grid away from the pointer.
  test.use({ viewport: { height: 900, width: 1600 } });

  test("is off unless workspaces.dockable is set", async ({ mount, page }) => {
    await mount(notDockable);
    const { grid } = await openMarkets(page);
    await expect(grid.locator(":scope > .vuuGridDockZone")).toHaveCount(0);
  });

  test("a palette row docks along the east edge, and the dock is saved", async ({
    mount,
    page,
  }) => {
    await mount(dockable);
    const { grid, row } = await openMarkets(page);
    await expect(grid.locator(":scope > .vuuGridDockZone")).toHaveCount(4);
    const content = await contentBox(grid);

    await startDrag(
      page,
      row,
      content.right - 4,
      content.y + content.height / 2,
    );
    const zone = grid.locator(":scope > .vuuGridDockZone-east");
    await expect(zone).toHaveClass(/vuuGridDockZone-targeted/);
    const indicator = await box(zone.locator(".vuuGridDockZone-indicator"));
    expect(indicator.height).toBeCloseTo(content.height, -1);
    await page.mouse.up();

    await expect(orderEntry(grid)).toBeVisible();
    await expect(zone).not.toHaveClass(/vuuGridDockZone-targeted/);
    await expectDockedEast(grid, orderEntry(grid));
    await expect(grid.locator(".vuuGridLayoutItem")).toHaveCount(3);
    // The edit made a personal copy of the system workspace.
    await expect(
      page
        .getByRole("link", { name: "Markets" })
        .locator('[data-workspace-tag="personal-copy"]'),
    ).toBeVisible();

    // Mount the portal again: Markets reopens from the saved personal copy.
    await page.evaluate(() => window.unmount());
    await mount(dockable);
    const reloaded = workspaceGrid(page);
    await expect(reloaded.locator(".vuuGridLayoutItem")).toHaveCount(3);
    await expectDockedEast(reloaded, orderEntry(reloaded));
  });

  test("a panel of the workspace docks along the west edge", async ({
    mount,
    page,
  }) => {
    await mount(dockable);
    const { grid } = await openMarkets(page);
    const content = await contentBox(grid);
    const chart = grid.locator(".vuuGridLayoutItem", {
      hasText: "Intraday prices",
    });
    const widthBefore = (await box(chart)).width;

    await startDrag(
      page,
      chart.locator(":scope > .vuuGridLayoutItemHeader"),
      content.x + 4,
      content.y + content.height / 2,
    );
    await expect(grid.locator(":scope > .vuuGridDockZone-west")).toHaveClass(
      /vuuGridDockZone-targeted/,
    );
    await page.mouse.up();

    await expect
      .poll(async () => (await box(chart)).x)
      .toBeCloseTo(content.x, 0);
    const docked = await box(chart);
    expect(docked.height).toBeCloseTo(content.height, 0);
    expect(docked.width).toBeCloseTo(widthBefore, -1);
  });

  test("Escape cancels a dock", async ({ mount, page }) => {
    await mount(dockable);
    const { grid, row } = await openMarkets(page);
    const content = await contentBox(grid);

    await startDrag(page, row, content.x + content.width / 2, content.y + 4);
    const zone = grid.locator(":scope > .vuuGridDockZone-north");
    await expect(zone).toHaveClass(/vuuGridDockZone-targeted/);
    await page.keyboard.press("Escape");
    await page.mouse.up();

    await expect(zone).not.toHaveClass(/vuuGridDockZone-targeted/);
    await expect(grid.locator(".vuuGridLayoutItem")).toHaveCount(2);
    await expect(orderEntry(grid)).toHaveCount(0);
  });
});
