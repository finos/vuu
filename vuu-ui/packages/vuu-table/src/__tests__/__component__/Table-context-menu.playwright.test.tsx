import { test } from "@playwright/experimental-ct-react";
import { expect } from "../../../../../playwright/customAssertions";
import { TableOM } from "./TableOM";
import { LocalContextMenu } from "../../../../../showcase/src/examples/Table/ContextMenu.examples";
import { ParentOrders } from "../../../../../showcase/src/examples/Table/Modules/SIMUL.examples";
import { LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";

test.describe("WHEN context menu is configured on table", () => {
  test.describe("WHEN cell is right clicked", () => {
    test("THEN context menu is displayed", async ({ mount, page }) => {
      await mount(
        <LocalDataSourceProvider>
          <LocalContextMenu />
        </LocalDataSourceProvider>,
      );

      const table = new TableOM(page.getByRole("table"));
      await table.locateCell("AAOP N").click({ button: "right" });

      const menu = page.getByRole("menu");
      await expect(menu).toBeInViewport();
      await menu.press("Escape");
      await expect(menu).not.toBeAttached();
    });

    test("THEN clicked cell has correct css classname", async ({
      mount,
      page,
    }) => {
      await mount(
        <LocalDataSourceProvider>
          <LocalContextMenu />
        </LocalDataSourceProvider>,
      );

      const table = new TableOM(page.getByRole("table"));
      const cell = table.locateCell("AAOP N");
      await cell.click({ button: "right" });
      await expect(cell).toContainClass("ContextOpen");

      await page.getByRole("menu").press("Escape");
      await expect(cell).not.toContainClass("ContextOpen");
    });
  });
});

test.describe("WHEN no context menu is configured on table", () => {
  test.describe("WHEN cell is right clicked", () => {
    test("THEN no context menu is displayed", async ({ mount, page }) => {
      await mount(
        <LocalDataSourceProvider>
          <ParentOrders />
        </LocalDataSourceProvider>,
      );

      const table = new TableOM(page.getByRole("table"));
      const cell = table.locateCell("GBP").nth(0);
      await cell.click({ button: "right" });
      await expect(page.getByRole("menu")).not.toBeAttached();
      await expect(cell).not.toContainClass("ContextOpen");
    });
  });
});
