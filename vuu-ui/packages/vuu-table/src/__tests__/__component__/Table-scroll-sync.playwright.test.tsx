import type { Page } from "@playwright/test";
import { expect, test } from "../../../../../playwright/fixtures";
import { TableOM } from "@vuu-ui/vuu-playwright-helpers";

const getScrollTops = (page: Page) =>
  page.evaluate(() => {
    const scrollTopPosition = (selector: string) => {
      const el = document.querySelector(selector) as HTMLElement;
      return {
        scrollTop: el.scrollTop,
        maxScrollTop: el.scrollHeight - el.clientHeight,
      };
    };
    return {
      scrollbar: scrollTopPosition(".vuuTable-scrollbarContainer"),
      content: scrollTopPosition(".vuuTable-contentContainer"),
    };
  });

type ScrollTopPosition = { scrollTop: number; maxScrollTop: number };
// scrollHeight and clientHeight are rounded to integers, so the true max
// scrollTop may differ from scrollHeight - clientHeight by up to 1px.
const isScrolledToEnd = ({ scrollTop, maxScrollTop }: ScrollTopPosition) =>
  maxScrollTop - scrollTop <= 1;

test.describe("Table scrollbar and content containers stay in sync", () => {
  test.describe("WHEN browser fires a scroll event without a change of position (e.g. on zoom) and End key pressed", () => {
    test("THEN both containers are scrolled to the end", async ({
      mount,
      page,
    }) => {
      await mount("Table/BigData/SimpleTableMillionRows");
      const table = new TableOM(page.getByRole("table"));
      const cell = table.locateCell(2, 1);
      await cell.click();

      await page.evaluate(() =>
        document
          .querySelector(".vuuTable-scrollbarContainer")
          ?.dispatchEvent(new Event("scroll")),
      );
      await cell.press("End");
      await expect(table.locateCell(1_000_001, 1)).toBeFocused();

      await expect
        .poll(async () => {
          const { scrollbar, content } = await getScrollTops(page);
          return [isScrolledToEnd(scrollbar), isScrolledToEnd(content)];
        })
        .toEqual([true, true]);
    });
  });

  test.describe("WHEN scrollbar container scrolled to end", () => {
    test("THEN content container is scrolled to end and last row is visible", async ({
      mount,
      page,
    }) => {
      await mount("Table/BigData/SimpleTableMillionRows");
      const table = new TableOM(page.getByRole("table"));
      await expect(table.locateCell(2, 1)).toBeVisible();

      await page.evaluate(() => {
        const el = document.querySelector(
          ".vuuTable-scrollbarContainer",
        ) as HTMLElement;
        el.scrollTop = el.scrollHeight;
      });

      await expect(table.locateCell(1_000_001, 1)).toBeVisible();
      const { content } = await getScrollTops(page);
      expect(isScrolledToEnd(content)).toBe(true);
    });
  });
});
