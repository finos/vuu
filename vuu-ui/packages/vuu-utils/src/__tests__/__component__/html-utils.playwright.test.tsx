import type { Page } from "@playwright/test";
import { test, expect } from "../../../../../playwright/fixtures";

type Mount = (story: string) => Promise<unknown>;

const measureMaxScrollHeight = async (mount: Mount, page: Page) => {
  await mount("Table/TEST/MaxScrollHeight");
  const text = await page.getByTestId("max-scroll-height").textContent();
  return Number(text);
};

// Playwright cannot apply browser zoom, CSS zoom has the same effect on layout limits
const applyZoom = (page: Page, zoom: number) =>
  page.evaluate((zoom) => {
    document.documentElement.style.zoom = `${zoom}`;
  }, zoom);

const isScrollableTo = (page: Page, height: number) =>
  page.evaluate((height) => {
    const outer = document.createElement("div");
    outer.style.cssText = "height:50px;overflow:scroll;";
    const inner = document.createElement("div");
    inner.style.height = `${height}px`;
    outer.appendChild(inner);
    document.body.appendChild(outer);
    outer.scrollTop = height;
    const { clientHeight, scrollTop } = outer;
    outer.remove();
    return scrollTop >= height - clientHeight - 1;
  }, height);

test.describe("getMaxScrollHeight", () => {
  test.describe("WHEN browser is not zoomed", () => {
    test("THEN returns a height the browser can scroll through, probe is removed", async ({
      mount,
      page,
    }) => {
      const bodyChildCount = await page.evaluate(
        () => document.body.childElementCount,
      );
      const maxScrollHeight = await measureMaxScrollHeight(mount, page);

      expect(maxScrollHeight).toBeGreaterThan(10_000_000);
      // Firefox limit includes the element's document offset, so allow a margin
      expect(
        await isScrollableTo(page, Math.floor(maxScrollHeight * 0.999)),
      ).toBe(true);
      expect(await isScrollableTo(page, maxScrollHeight + 10)).toBe(false);
      expect(
        await page.evaluate(() => document.body.childElementCount),
      ).toEqual(bodyChildCount);
    });
  });

  test.describe("WHEN browser is zoomed to 300%", () => {
    test("THEN max scroll height is a third of unzoomed value, and can be scrolled through", async ({
      mount,
      page,
    }) => {
      const unzoomedMaxScrollHeight = await measureMaxScrollHeight(mount, page);

      // fresh page, so cached value is discarded
      await page.reload();
      await applyZoom(page, 3);
      const zoomedMaxScrollHeight = await measureMaxScrollHeight(mount, page);

      expect(zoomedMaxScrollHeight).toBeCloseTo(
        unzoomedMaxScrollHeight / 3,
        -2,
      );
      expect(
        await isScrollableTo(page, Math.floor(zoomedMaxScrollHeight * 0.999)),
      ).toBe(true);
    });
  });
});
