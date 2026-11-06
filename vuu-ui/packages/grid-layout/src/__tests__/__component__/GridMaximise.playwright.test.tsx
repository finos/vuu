import type { Locator, Page } from "@playwright/test";
import { expect, test } from "../../../../../playwright/fixtures";

const fixture = "GridLayout/GridLayoutTestFixture/GridLayoutTestFixture";

const box = async (locator: Locator) => {
  const result = await locator.boundingBox();
  if (!result) {
    throw Error("element has no bounding box");
  }
  return result;
};

/** The grid's box inside its padding, which a maximised item fills. */
const contentBox = async (grid: Locator) => {
  const padding = await grid.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).paddingTop),
  );
  const { height, width, x, y } = await box(grid);
  return {
    height: height - 2 * padding,
    width: width - 2 * padding,
    x: x + padding,
    y: y + padding,
  };
};

const expectToFill = async (item: Locator, grid: Locator) => {
  const itemBox = await box(item);
  const gridBox = await contentBox(grid);
  expect(itemBox.x).toBeCloseTo(gridBox.x, 0);
  expect(itemBox.y).toBeCloseTo(gridBox.y, 0);
  expect(itemBox.width).toBeCloseTo(gridBox.width, 0);
  expect(itemBox.height).toBeCloseTo(gridBox.height, 0);
};

const item = (page: Page, id: string) => page.locator(`[id="${id}"]`);
const button = (page: Page, id: string, name: string) =>
  item(page, id)
    .locator(":scope > .vuuGridLayoutItemHeader")
    .getByRole("button", {
      exact: true,
      name,
    });

test.describe("GridLayout maximise", () => {
  test("Maximise fills the grid and hides everything else", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "maximise" });
    const grid = component.locator('[id="ct-grid"]');

    await button(page, "a", "Maximise").click();

    await expectToFill(item(page, "a"), grid);
    for (const id of ["b", "c", "d", "b-splitter-h", "c-splitter-v"]) {
      await expect(item(page, id)).toBeHidden();
    }
    await expect(button(page, "a", "Restore")).toBeFocused();
    await expect(grid).toHaveAttribute("data-commit-count", "0");
  });

  test("Restore puts every item back where it was", async ({ mount, page }) => {
    await mount(fixture, { variant: "maximise" });
    const ids = ["a", "b", "c", "d"];
    const before = await Promise.all(ids.map((id) => box(item(page, id))));

    await button(page, "b", "Maximise").click();
    await button(page, "b", "Restore").click();

    expect(await Promise.all(ids.map((id) => box(item(page, id))))).toEqual(
      before,
    );
    await expect(button(page, "b", "Maximise")).toBeFocused();
  });

  test("double-clicking a header toggles maximise", async ({ mount, page }) => {
    const component = await mount(fixture, { variant: "maximise" });
    const grid = component.locator('[id="ct-grid"]');
    const header = (id: string) =>
      item(page, id).locator(".vuuGridLayoutItemHeader-title");

    await header("c").dblclick();
    await expectToFill(item(page, "c"), grid);
    await header("c").dblclick();
    await expect(item(page, "a")).toBeVisible();
  });

  test("an item can opt out of maximising", async ({ mount, page }) => {
    await mount(fixture, { variant: "maximise" });

    await expect(button(page, "d", "Maximise")).toHaveCount(0);
    await item(page, "d").locator(".vuuGridLayoutItemHeader-title").dblclick();
    await expect(item(page, "a")).toBeVisible();
  });

  test("Escape restores the grid", async ({ mount, page }) => {
    await mount(fixture, { variant: "maximise" });

    await button(page, "a", "Maximise").click();
    await page.getByRole("button", { name: "A one" }).focus();
    await page.keyboard.press("Escape");

    await expect(item(page, "b")).toBeVisible();
  });

  test("Tab only reaches the maximised item", async ({ mount, page }) => {
    await mount(fixture, { variant: "maximise" });

    await button(page, "a", "Maximise").click();
    await page.getByRole("button", { name: "Before" }).focus();
    const sequence: string[] = [];
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press("Tab");
      sequence.push(
        await page.evaluate(
          () =>
            document.activeElement?.getAttribute("aria-label") ??
            document.activeElement
              ?.querySelector("[aria-label]")
              ?.getAttribute("aria-label") ??
            document.activeElement?.textContent ??
            "",
        ),
      );
    }

    expect(sequence).toEqual(["Restore", "Close", "A one", "After"]);
  });

  test("hidden items keep their scroll position", async ({ mount, page }) => {
    await mount(fixture, { variant: "maximise" });
    const scroller = page.getByTestId("b-scroller");
    await scroller.evaluate((element) => {
      element.scrollTop = 500;
    });

    await button(page, "a", "Maximise").click();
    await button(page, "a", "Restore").click();

    expect(await scroller.evaluate((element) => element.scrollTop)).toBe(500);
  });

  test("dragging is disabled while maximised", async ({ mount, page }) => {
    await mount(fixture, { variant: "maximise" });
    const header = item(page, "a").locator(".vuuGridLayoutItemHeader");

    await expect(header).toHaveAttribute("draggable", "true");
    await button(page, "a", "Maximise").click();
    await expect(header).toHaveAttribute("draggable", "false");
  });

  test("closing the maximised item restores the grid", async ({
    mount,
    page,
  }) => {
    await mount(fixture, { variant: "maximise" });

    await button(page, "a", "Maximise").click();
    await button(page, "a", "Close").click();

    await expect(item(page, "a")).toHaveCount(0);
    for (const id of ["b", "c", "d"]) {
      await expect(item(page, id)).toBeVisible();
    }
  });

  test("a nested grid's item fills only its own grid", async ({
    mount,
    page,
  }) => {
    await mount(fixture, { variant: "maximise-nested" });
    const innerGrid = page.locator('[id="inner-grid"]');

    await button(page, "inner-top", "Maximise").click();

    await expectToFill(item(page, "inner-top"), innerGrid);
    await expect(item(page, "inner-bottom")).toBeHidden();
    await expect(item(page, "right")).toBeVisible();
  });

  test("Escape restores one grid at a time", async ({ mount, page }) => {
    await mount(fixture, { variant: "maximise-nested" });

    await button(page, "host", "Maximise").click();
    await button(page, "inner-top", "Maximise").click();
    await expect(item(page, "right")).toBeHidden();

    await page.keyboard.press("Escape");
    await expect(item(page, "inner-bottom")).toBeVisible();
    await expect(item(page, "right")).toBeHidden();

    await page.keyboard.press("Escape");
    await expect(item(page, "right")).toBeVisible();
  });
});
