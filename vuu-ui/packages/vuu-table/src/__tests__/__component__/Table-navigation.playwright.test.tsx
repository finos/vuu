import { test } from "@playwright/experimental-ct-react";
import { TabInAndOutFixture } from "../../../../../showcase/src/examples/Table/Misc.examples";
import { LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";
import { expect } from "../../../../../playwright/customAssertions";
import { TableOM } from "./TableOM";

test.describe("Cell navigation with keyboard", () => {
  test.describe("navigation from outside with Tab", () => {
    test("begins navigation in first header cell", async ({
      browserName,
      mount,
      page,
    }) => {
      // The focus doesn't happen on firefox, need to investigate
      test.skip(browserName === "firefox");

      await mount(<TabInAndOutFixture />);
      const table = new TableOM(page.getByRole("table"));
      await table.assertVisible();

      const input = page.getByTestId("input-start");
      await input.click();
      await input.press("Tab");
      const header = table.locateColumnHeader(1);
      await expect(header).toHaveClass("vuuTableHeaderCell");
      await expect(header).toBeFocused();
    });
  });

  test.describe("when columns contain column menu", () => {
    test("navigation goes from header to next header cell", async ({
      mount,
      page,
    }) => {
      await mount(<TabInAndOutFixture />);
      const table = new TableOM(page.getByRole("table"));
      await table.assertVisible();

      let header = table.locateColumnHeader(1);
      await header.click();
      await expect(header).toBeFocused();
      await header.press("ArrowRight");
      header = table.locateColumnHeader(2);
      await expect(header).toBeFocused();
      await header.press("ArrowRight");
      await expect(table.locateColumnHeader(3)).toBeFocused();
    });

    test.describe("and shift is pressed with Arrow key", () => {
      test("then column menu is included in navigation", async ({
        mount,
        page,
      }) => {
        await mount(<TabInAndOutFixture />);
        const table = new TableOM(page.getByRole("table"));
        await table.assertVisible();

        const header1 = table.locateColumnHeader(1);
        await header1.click();
        await expect(header1).toBeFocused();
        await header1.press("Shift+ArrowRight");
        await expect(header1.getByRole("button")).toBeFocused();
        await header1.getByRole("button").press("Shift+ArrowRight");

        const header2 = table.locateColumnHeader(2);
        await expect(header2).toBeFocused();
        await header2.press("Shift+ArrowRight");
        await expect(header2.getByRole("button")).toBeFocused();
      });
    });
  });

  test.describe("when column header cell focused", () => {
    test.describe("and UpArrow pressed", () => {
      test("does nothing", async ({ mount, page }) => {
        await mount(<TabInAndOutFixture />);
        const table = new TableOM(page.getByRole("table"));
        await table.assertVisible();

        const header = table.locateColumnHeader(1);
        await header.press("ArrowUp");
        await expect(header).toBeFocused();
      });
    });
    test.describe("and DownArrow pressed", () => {
      test("navigates to first data cell in same column", async ({
        mount,
        page,
      }) => {
        await mount(<TabInAndOutFixture />);
        const table = new TableOM(page.getByRole("table"));
        await table.assertVisible();

        const header = table.locateColumnHeader(1);
        await header.click();
        await header.press("ArrowDown");
        await expect(table.locateCell(2, 1)).toBeFocused();
      });
    });
  });
});
