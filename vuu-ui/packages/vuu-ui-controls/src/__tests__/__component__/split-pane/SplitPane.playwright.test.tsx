import type { Locator } from "@playwright/test";
import { expect, test } from "../../../../../../playwright/fixtures";

const sizesOf = async (
  pane1: Locator,
  pane2: Locator,
  dimension: "width" | "height",
) => {
  const box1 = await pane1.boundingBox();
  const box2 = await pane2.boundingBox();
  return [box1?.[dimension] ?? 0, box2?.[dimension] ?? 0];
};

test.describe("Given a SplitPane", () => {
  test("THEN a splitter is rendered between the two panes", async ({
    mount,
  }) => {
    const component = await mount("UiControls/SplitPane/DefaultSplitPane");
    const splitPane = component.getByTestId("split-pane");
    const splitter = splitPane.getByRole("separator");
    await expect(splitter).toHaveCount(1);
    await expect(splitter).toHaveAttribute("aria-orientation", "vertical");
    await expect(splitter).toHaveAttribute("tabindex", "0");
    const children = splitPane.locator(":scope > *");
    await expect(children).toHaveCount(3);
    await expect(children.nth(0)).toHaveAttribute("data-testid", "pane-1");
    await expect(children.nth(1)).toHaveAttribute("role", "separator");
    await expect(children.nth(2)).toHaveAttribute("data-testid", "pane-2");
  });

  test.describe("WHEN splitter is dragged with mouse", () => {
    test("THEN panes are resized and onSplitterMoved invoked", async ({
      mount,
      page,
    }) => {
      const component = await mount("UiControls/SplitPane/DefaultSplitPane");
      const pane1 = component.getByTestId("pane-1");
      const pane2 = component.getByTestId("pane-2");
      const splitter = component.getByRole("separator");

      const [w1, w2] = await sizesOf(pane1, pane2, "width");
      expect(w1).toBeCloseTo(200, 0);

      const box = await splitter.boundingBox();
      if (box === null) throw Error("no splitter bounding box");
      const x = box.x + box.width / 2;
      const y = box.y + box.height / 2;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x + 50, y, { steps: 5 });
      await page.mouse.up();

      const [newW1, newW2] = await sizesOf(pane1, pane2, "width");
      expect(newW1).toBeCloseTo(w1 + 50, 0);
      expect(newW2).toBeCloseTo(w2 - 50, 0);
      await expect(component.getByTestId("sizes")).toHaveValue(
        `${Math.round(newW1)},${Math.round(newW2)}`,
      );
      await expect(splitter).toBeFocused();
    });
  });

  test.describe("WHEN splitter is focused and arrow keys pressed", () => {
    test("THEN panes are resized", async ({ mount, page }) => {
      const component = await mount("UiControls/SplitPane/DefaultSplitPane");
      const pane1 = component.getByTestId("pane-1");
      const pane2 = component.getByTestId("pane-2");
      const splitter = component.getByRole("separator");
      const [w1] = await sizesOf(pane1, pane2, "width");

      await splitter.focus();
      await page.keyboard.press("ArrowRight");
      await page.keyboard.press("Shift+ArrowRight");
      expect((await sizesOf(pane1, pane2, "width"))[0]).toBeCloseTo(w1 + 11, 0);
      await page.keyboard.press("ArrowLeft");
      expect((await sizesOf(pane1, pane2, "width"))[0]).toBeCloseTo(w1 + 10, 0);
    });
  });

  test.describe("WHEN direction is column", () => {
    test("THEN splitter resizes panes vertically", async ({ mount, page }) => {
      const component = await mount("UiControls/SplitPane/ColumnSplitPane");
      const pane1 = component.getByTestId("pane-1");
      const pane2 = component.getByTestId("pane-2");
      const splitter = component.getByRole("separator");
      await expect(splitter).toHaveAttribute("aria-orientation", "horizontal");

      const [h1, h2] = await sizesOf(pane1, pane2, "height");
      await splitter.focus();
      await page.keyboard.press("Shift+ArrowDown");
      const [newH1, newH2] = await sizesOf(pane1, pane2, "height");
      expect(newH1).toBeCloseTo(h1 + 10, 0);
      expect(newH2).toBeCloseTo(h2 - 10, 0);
    });
  });

  test.describe("WHEN panes have min and max sizes", () => {
    test("THEN splitter movement respects them", async ({ mount, page }) => {
      const component = await mount(
        "UiControls/SplitPane/SplitPaneMinMaxSizes",
      );
      const pane1 = component.getByTestId("pane-1");
      const pane2 = component.getByTestId("pane-2");
      const splitter = component.getByRole("separator");

      await splitter.focus();
      await page.keyboard.press("Home");
      expect((await sizesOf(pane1, pane2, "width"))[0]).toBeCloseTo(100, 0);

      await page.keyboard.press("End");
      const [w1, w2] = await sizesOf(pane1, pane2, "width");
      expect(w1).toBeCloseTo(400, 0);
      expect(w2).toBeGreaterThanOrEqual(150);
    });
  });

  test.describe("WHEN only a single child is rendered", () => {
    test("THEN no splitter is rendered", async ({ mount }) => {
      const component = await mount(
        "UiControls/SplitPane/SplitPaneSingleChild",
      );
      await expect(component.getByRole("separator")).toHaveCount(1);
      await component.getByRole("button").click();
      await expect(component.getByRole("separator")).toHaveCount(0);
    });
  });
});
