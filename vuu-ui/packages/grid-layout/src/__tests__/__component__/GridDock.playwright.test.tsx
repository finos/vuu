import type { Locator, Page } from "@playwright/test";
import { expect, test } from "../../../../../playwright/fixtures";
import { GridLayoutDriver } from "./GridLayoutDriver";

const fixture = "GridLayout/GridLayoutTestFixture/GridLayoutTestFixture";

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

const dragHandle = (item: Locator) =>
  item.locator(":scope > .vuuGridLayoutItemHeader");

/** Presses on `source` and moves, in steps, to (x, y). */
const startDrag = async (page: Page, source: Locator, x: number, y: number) => {
  const { height, width, x: left, y: top } = await box(source);
  await page.mouse.move(left + width / 2, top + height / 2);
  await page.mouse.down();
  await page.mouse.move(left + width / 2 + 20, top + height / 2 + 20, {
    steps: 4,
  });
  await page.mouse.move(x, y, { steps: 10 });
};

const dragTo = async (page: Page, source: Locator, x: number, y: number) => {
  await startDrag(page, source, x, y);
  await page.mouse.up();
};

test.describe("GridLayout edge docking", () => {
  test("an item dragged to the west edge docks along the whole edge", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "dock" });
    const grid = new GridLayoutDriver(component, page);
    const layout = component.locator('[id="ct-grid"]');
    const content = await contentBox(layout);
    const widthBefore = (await box(grid.item("b"))).width;

    await dragTo(
      page,
      dragHandle(grid.item("b")),
      content.x + 4,
      content.y + content.height / 2,
    );

    await expect
      .poll(async () => (await box(grid.item("b"))).height)
      .toBeCloseTo(content.height, 0);
    const docked = await box(grid.item("b"));
    expect(docked.x).toBeCloseTo(content.x, 0);
    expect(docked.width).toBeCloseTo(widthBefore, -1);
    expect((await box(grid.item("a"))).x).toBeGreaterThan(
      docked.x + docked.width,
    );
    expect((await box(grid.item("c"))).x).toBeGreaterThan(
      docked.x + docked.width,
    );
  });

  test("the targeted edge shows where the item will go, at its size", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "dock" });
    const grid = new GridLayoutDriver(component, page);
    const layout = component.locator('[id="ct-grid"]');
    const content = await contentBox(layout);
    const heightBefore = (await box(grid.item("a"))).height;

    await startDrag(
      page,
      dragHandle(grid.item("a")),
      content.x + content.width / 2,
      content.bottom - 4,
    );
    const zone = layout.locator(":scope > .vuuGridDockZone-south");
    await expect(zone).toHaveClass(/vuuGridDockZone-targeted/);
    const indicator = await box(zone.locator(".vuuGridDockZone-indicator"));
    expect(indicator.height).toBeCloseTo(heightBefore, 0);
    expect(indicator.width).toBeCloseTo(content.width, -1);
    await page.mouse.up();

    await expect
      .poll(async () => (await box(grid.item("a"))).width)
      .toBeCloseTo(content.width, 0);
    const docked = await box(grid.item("a"));
    expect(docked.y + docked.height).toBeCloseTo(content.bottom, 0);
    await expect(zone).not.toHaveClass(/vuuGridDockZone-targeted/);
  });

  test("a template docks at a quarter of the grid", async ({ mount, page }) => {
    const component = await mount(fixture, { variant: "dock" });
    const layout = component.locator('[id="ct-grid"]');
    const content = await contentBox(layout);
    const source = component.getByTestId("palette-item-1").getByRole("button");

    await dragTo(
      page,
      source,
      content.right - 4,
      content.y + content.height / 2,
    );

    const inserted = layout.getByTestId("template-content");
    await expect(inserted).toBeVisible();
    const item = layout.locator(".vuuGridLayoutItem", {
      has: page.getByTestId("template-content"),
    });
    const docked = await box(item);
    expect(docked.x + docked.width).toBeCloseTo(content.right, 0);
    expect(docked.height).toBeCloseTo(content.height, 0);
    const gridWidth = (await box(layout)).width;
    expect(docked.width).toBeGreaterThan(gridWidth * 0.25 - 15);
    expect(docked.width).toBeLessThan(gridWidth * 0.25 + 15);
  });

  test("a splitter beside a docked item stays within the grid", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "dock" });
    const layout = component.locator('[id="ct-grid"]');
    const content = await contentBox(layout);
    const template = component
      .getByTestId("palette-item-1")
      .getByRole("button");

    await dragTo(page, template, content.x + 4, content.y + content.height / 2);
    await expect(layout.getByTestId("template-content")).toHaveCount(1);
    await dragTo(
      page,
      template,
      content.right - 4,
      content.y + content.height / 2,
    );
    await expect(layout.getByTestId("template-content")).toHaveCount(2);

    const east = layout
      .locator(".vuuGridLayoutItem", {
        has: page.getByTestId("template-content"),
      })
      .last();
    const docked = await box(east);
    expect(docked.x + docked.width).toBeCloseTo(content.right, 0);

    const splitters = layout.locator(
      ':scope > .vuuGridSplitter[aria-orientation="vertical"]',
    );
    const boxes = await splitters.evaluateAll((elements) =>
      elements.map((element) => element.getBoundingClientRect().toJSON()),
    );
    const index = boxes.findIndex(
      ({ height, width, x }) =>
        Math.abs(x + width / 2 - docked.x) < 10 && height > content.height / 2,
    );
    expect(index).not.toBe(-1);
    const splitter = boxes[index];
    const y = splitter.y + splitter.height / 2;
    await page.mouse.move(splitter.x + splitter.width / 2, y);
    await page.mouse.down();
    await page.mouse.move(splitter.x + splitter.width / 2 + 60, y, {
      steps: 6,
    });
    await page.mouse.up();

    const resized = await box(east);
    expect(resized.x + resized.width).toBeCloseTo(content.right, 0);
    expect(resized.width).toBeCloseTo(docked.width - 60, -1);
    expect(
      await layout.evaluate(
        (element) => element.scrollWidth - element.clientWidth,
      ),
    ).toBeLessThanOrEqual(1);
  });

  test("Undo reverts a dock", async ({ mount, page }) => {
    const component = await mount(fixture, { variant: "dock" });
    const grid = new GridLayoutDriver(component, page);
    const layout = component.locator('[id="ct-grid"]');
    const content = await contentBox(layout);
    const before = await box(grid.item("b"));

    await dragTo(
      page,
      dragHandle(grid.item("b")),
      content.x + 4,
      content.y + content.height / 2,
    );
    await expect
      .poll(async () => (await box(grid.item("b"))).x)
      .toBeCloseTo(content.x, 0);

    await page.getByRole("button", { exact: true, name: "Undo" }).click();
    await expect
      .poll(async () => (await box(grid.item("b"))).x)
      .toBeCloseTo(before.x, 0);
    expect((await box(grid.item("b"))).height).toBeCloseTo(before.height, 0);
  });

  test("a drop on a top-row header still stacks", async ({ mount, page }) => {
    const component = await mount(fixture, { variant: "dock" });
    const grid = new GridLayoutDriver(component, page);
    await grid.nativeDrag(
      grid.item("a"),
      grid.item("b").locator(":scope > .vuuGridLayoutItemHeader"),
      "header",
    );
    await expect(component.getByRole("tab", { name: "a" })).toBeVisible();
    await expect(component.getByRole("tab", { name: "b" })).toBeVisible();
  });

  test("the zones let the pointer through when nothing is dragged", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "dock" });
    const grid = new GridLayoutDriver(component, page);
    await grid
      .item("a")
      .locator(":scope > .vuuGridLayoutItemHeader")
      .getByRole("button", { exact: true, name: "Close" })
      .click();
    await expect(grid.item("a")).toHaveCount(0);
  });
});
