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

/** The grid's box inside its padding, which a maximized item fills. */
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

test.describe("GridLayout maximize", () => {
  test("Maximize fills the grid and hides everything else", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "maximize" });
    const grid = component.locator('[id="ct-grid"]');

    await button(page, "a", "Maximize").click();

    await expectToFill(item(page, "a"), grid);
    for (const id of ["b", "c", "d", "b-splitter-h", "c-splitter-v"]) {
      await expect(item(page, id)).toBeHidden();
    }
    await expect(button(page, "a", "Restore")).toBeFocused();
    await expect(grid).toHaveAttribute("data-commit-count", "0");
  });

  test("Restore puts every item back where it was", async ({ mount, page }) => {
    await mount(fixture, { variant: "maximize" });
    const ids = ["a", "b", "c", "d"];
    const before = await Promise.all(ids.map((id) => box(item(page, id))));

    await button(page, "b", "Maximize").click();
    await button(page, "b", "Restore").click();

    expect(await Promise.all(ids.map((id) => box(item(page, id))))).toEqual(
      before,
    );
    await expect(button(page, "b", "Maximize")).toBeFocused();
  });

  test("double-clicking a header toggles maximize", async ({ mount, page }) => {
    const component = await mount(fixture, { variant: "maximize" });
    const grid = component.locator('[id="ct-grid"]');
    const header = (id: string) =>
      item(page, id).locator(".vuuGridLayoutItemHeader-title");

    await header("c").dblclick();
    await expectToFill(item(page, "c"), grid);
    await header("c").dblclick();
    await expect(item(page, "a")).toBeVisible();
  });

  test("an item can opt out of maximizing", async ({ mount, page }) => {
    await mount(fixture, { variant: "maximize" });

    await expect(button(page, "d", "Maximize")).toHaveCount(0);
    await item(page, "d").locator(".vuuGridLayoutItemHeader-title").dblclick();
    await expect(item(page, "a")).toBeVisible();
  });

  test("Escape restores the grid", async ({ mount, page }) => {
    await mount(fixture, { variant: "maximize" });

    await button(page, "a", "Maximize").click();
    await page.getByRole("button", { name: "A one" }).focus();
    await page.keyboard.press("Escape");

    await expect(item(page, "b")).toBeVisible();
  });

  test("Tab only reaches the maximized item", async ({ mount, page }) => {
    await mount(fixture, { variant: "maximize" });

    await button(page, "a", "Maximize").click();
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
    await mount(fixture, { variant: "maximize" });
    const scroller = page.getByTestId("b-scroller");
    await scroller.evaluate((element) => {
      element.scrollTop = 500;
    });

    await button(page, "a", "Maximize").click();
    await button(page, "a", "Restore").click();

    expect(await scroller.evaluate((element) => element.scrollTop)).toBe(500);
  });

  test("dragging is disabled while maximized", async ({ mount, page }) => {
    await mount(fixture, { variant: "maximize" });
    const header = item(page, "a").locator(".vuuGridLayoutItemHeader");

    await expect(header).toHaveAttribute("draggable", "true");
    await button(page, "a", "Maximize").click();
    await expect(header).toHaveAttribute("draggable", "false");
  });

  test("closing the maximized item restores the grid", async ({
    mount,
    page,
  }) => {
    await mount(fixture, { variant: "maximize" });

    await button(page, "a", "Maximize").click();
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
    await mount(fixture, { variant: "maximize-nested" });
    const innerGrid = page.locator('[id="inner-grid"]');

    await button(page, "inner-top", "Maximize").click();

    await expectToFill(item(page, "inner-top"), innerGrid);
    await expect(item(page, "inner-bottom")).toBeHidden();
    await expect(item(page, "right")).toBeVisible();
  });

  test("Escape restores one grid at a time", async ({ mount, page }) => {
    await mount(fixture, { variant: "maximize-nested" });

    await button(page, "host", "Maximize").click();
    await button(page, "inner-top", "Maximize").click();
    await expect(item(page, "right")).toBeHidden();

    await page.keyboard.press("Escape");
    await expect(item(page, "inner-bottom")).toBeVisible();
    await expect(item(page, "right")).toBeHidden();

    await page.keyboard.press("Escape");
    await expect(item(page, "right")).toBeVisible();
  });

  test("a stack maximizes with its tab strip and stays maximized across tabs", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "maximize-stacked" });
    const grid = component.locator('[id="ct-grid"]');
    const strip = item(page, "tabs");

    await strip.getByRole("button", { exact: true, name: "Maximize" }).click();

    const stripBox = await box(strip);
    const gridBox = await contentBox(grid);
    expect(stripBox.x).toBeCloseTo(gridBox.x, 0);
    expect(stripBox.width).toBeCloseTo(gridBox.width, 0);
    expect((await box(item(page, "alpha"))).width).toBeCloseTo(
      gridBox.width,
      0,
    );
    await expect(item(page, "first")).toBeHidden();
    await expect(
      strip.getByRole("button", { exact: true, name: "Restore" }),
    ).toBeFocused();

    await strip.getByRole("tab", { name: "Beta" }).click();
    await expect(item(page, "beta")).toBeVisible();
    expect((await box(item(page, "beta"))).width).toBeCloseTo(gridBox.width, 0);
    await expect(item(page, "first")).toBeHidden();

    await strip.getByRole("button", { exact: true, name: "Restore" }).click();
    await expect(item(page, "first")).toBeVisible();
  });

  test("the commands API maximizes and restores", async ({ mount, page }) => {
    await mount(fixture, { variant: "maximize-stacked" });
    const log = page.getByTestId("maximize-log");

    await page.getByRole("button", { name: "API maximize beta" }).click();
    await expect(item(page, "first")).toBeHidden();
    await expect(log).toHaveAttribute("data-maximized-id", "tabs");

    await page.getByRole("button", { name: "API maximize first" }).click();
    await expect(item(page, "tabs")).toBeHidden();
    await expect(log).toHaveAttribute("data-maximized-id", "first");

    await page.getByRole("button", { name: "API restore" }).click();
    await expect(item(page, "tabs")).toBeVisible();
    await expect(log).toHaveAttribute(
      "data-maximized-log",
      "tabs,first,restored",
    );
  });

  test("onMaximizedChange reports a restore caused by closing", async ({
    mount,
    page,
  }) => {
    await mount(fixture, { variant: "maximize-stacked" });
    const log = page.getByTestId("maximize-log");

    await button(page, "first", "Maximize").click();
    await button(page, "first", "Close").click();

    await expect(log).toHaveAttribute("data-maximized-log", "first,restored");
    await expect(item(page, "tabs")).toBeVisible();
  });

  test.describe("content opt-out", () => {
    test("content that refuses has no Maximize button until it allows it", async ({
      mount,
      page,
    }) => {
      await mount(fixture, { variant: "maximize-content" });

      await expect(button(page, "content", "Maximize")).toHaveCount(0);
      await page
        .getByRole("button", { name: "Allow maximize content" })
        .click();
      await button(page, "content", "Maximize").click();
      await expect(item(page, "fixed")).toBeHidden();
    });

    test("refusing while maximized restores the grid", async ({
      mount,
      page,
    }) => {
      await mount(fixture, { variant: "maximize-content" });

      await page
        .getByRole("button", { name: "Allow maximize content" })
        .click();
      await button(page, "content", "Maximize").click();
      await page
        .getByRole("button", { name: "Refuse maximize content" })
        .click();

      await expect(item(page, "fixed")).toBeVisible();
      await expect(button(page, "content", "Maximize")).toHaveCount(0);
      await page
        .getByRole("button", { name: "Allow maximize content" })
        .click();
      await expect(item(page, "fixed")).toBeVisible();
    });

    test("the commands API can't maximize refused content", async ({
      mount,
      page,
    }) => {
      await mount(fixture, { variant: "maximize-content" });

      await page.getByRole("button", { name: "API maximize content" }).click();

      await expect(page.getByTestId("api-error")).toHaveAttribute(
        "data-api-error",
        /not a maximizable item or stack/,
      );
      await expect(item(page, "fixed")).toBeVisible();
    });

    test("a stack follows the content of its selected tab", async ({
      mount,
      page,
    }) => {
      await mount(fixture, { variant: "maximize-content" });
      const strip = item(page, "tabs");
      const maximizeButton = strip.getByRole("button", {
        exact: true,
        name: "Maximize",
      });

      await expect(maximizeButton).toHaveCount(0);
      await strip.getByRole("tab", { name: "Table" }).click();
      await expect(maximizeButton).toHaveCount(1);
    });

    test("fixed-size items aren't offered maximize unless they opt in", async ({
      mount,
      page,
    }) => {
      await mount(fixture, { variant: "maximize-content" });

      await expect(button(page, "fixed", "Maximize")).toHaveCount(0);
      await expect(button(page, "fixed-opt-in", "Maximize")).toHaveCount(1);
    });
  });
});
