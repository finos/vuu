import { expect, test } from "../../../../../playwright/fixtures";
import { PwTable } from "@vuu-ui/vuu-playwright-helpers";

const STORY = "Table/ContextMenu/NestedContextMenu";

test.describe("WHEN context menu with nested menus is invoked from table cell", () => {
  test("THEN top level menu items are displayed", async ({ mount, page }) => {
    await mount(STORY);
    const menu = await new PwTable(page).showContextMenu("ric", 2);

    expect(await menu.hasMenuItems()).toBe(true);
    expect(
      await menu.hasMenuItems(["Copy text", "Filter", "Sort", "Delete row"]),
    ).toBe(true);
    expect(await menu.menuItemLabels()).toEqual([
      "Copy text",
      "Filter",
      "Sort",
      "Delete row",
    ]);
  });

  test("THEN menu item attributes are correct", async ({ mount, page }) => {
    await mount(STORY);
    const menu = await new PwTable(page).showContextMenu("ric", 2);

    const copy = menu.menuItem("Copy text");
    expect(await copy.hasIcon("edit")).toBe(true);
    expect(await copy.hasIcon("filter")).toBe(false);
    expect(await copy.hasChildren()).toBe(false);
    expect(await copy.isEnabled()).toBe(true);

    const filter = menu.menuItem("Filter");
    expect(await filter.hasChildren()).toBe(true);
    expect(await filter.isExpanded()).toBe(false);

    const deleteRow = menu.menuItem("Delete row");
    expect(await deleteRow.isDisabled()).toBe(true);
    expect(await deleteRow.isEnabled()).toBe(false);

    expect(await menu.menuItem(1).label()).toEqual("Filter");
  });

  test("THEN clicking a leaf item invokes action and closes menu", async ({
    mount,
    page,
  }) => {
    await mount(STORY);
    const table = new PwTable(page);
    const ric = await (await table.cell("ric", 2)).innerText();
    const menu = await table.showContextMenu("ric", 2);

    await menu.menuItem("Copy text").click();
    await menu.assertNotAttached();
    await expect(page.getByTestId("menu-action")).toHaveText(
      `cell-copy:ric:${ric}`,
    );
  });

  test("THEN clicking a disabled item does nothing", async ({
    mount,
    page,
  }) => {
    await mount(STORY);
    const menu = await new PwTable(page).showContextMenu("ric", 2);

    await menu.menuItem("Delete row").click({ force: true });
    await menu.assertVisible();
    await expect(page.getByTestId("menu-action")).toHaveText("");
  });

  test("THEN Escape closes the menu", async ({ mount, page }) => {
    await mount(STORY);
    const menu = await new PwTable(page).showContextMenu("ric", 2);
    await menu.close();
  });

  test.describe("WHEN sub menu is opened with mouse", () => {
    test("THEN sub menu items are displayed and can be invoked", async ({
      mount,
      page,
    }) => {
      await mount(STORY);
      const table = new PwTable(page);
      const ric = await (await table.cell("ric", 3)).innerText();
      const menu = await table.showContextMenu("ric", 3);

      const filterItem = menu.menuItem("Filter");
      const filterMenu = await filterItem.openSubMenu();
      expect(await filterItem.isExpanded()).toBe(true);
      expect(await filterMenu.menuItemLabels()).toEqual([
        "Include value",
        "Exclude value",
      ]);
      expect(await filterMenu.menuItem("Include value").hasIcon("filter")).toBe(
        true,
      );
      // top level menu items are unaffected by the open sub menu
      expect(await menu.menuItemLabels()).toEqual([
        "Copy text",
        "Filter",
        "Sort",
        "Delete row",
      ]);

      await filterMenu.menuItem("Exclude value").click();
      await menu.assertNotAttached();
      await filterMenu.assertNotAttached();
      await expect(page.getByTestId("menu-action")).toHaveText(
        `filter-exclude:ric:${ric}`,
      );
    });
  });

  test.describe("WHEN menu is navigated with keyboard", () => {
    test("THEN arrow keys move focus between items, skipping disabled items", async ({
      mount,
      page,
    }) => {
      await mount(STORY);
      const menu = await new PwTable(page).showContextMenu("ric", 2);

      await menu.press("ArrowDown");
      await menu.assertFocusedMenuItem("Copy text");
      await menu.press("ArrowDown");
      await menu.assertFocusedMenuItem("Filter");
      await menu.press("ArrowDown");
      await menu.assertFocusedMenuItem("Sort");
      // Delete row is disabled, so focus remains on Sort
      await menu.press("ArrowDown");
      await menu.assertFocusedMenuItem("Sort");
      await menu.press("ArrowUp");
      await menu.assertFocusedMenuItem("Filter");
    });

    test("THEN ArrowRight opens sub menu, ArrowLeft closes it", async ({
      mount,
      page,
    }) => {
      await mount(STORY);
      const menu = await new PwTable(page).showContextMenu("ric", 2);

      const sortMenu = await menu.menuItem("Sort").openSubMenu("keyboard");
      await sortMenu.assertFocusedMenuItem("Ascending");
      await menu.press("ArrowDown");
      await sortMenu.assertFocusedMenuItem("Descending");

      await menu.press("ArrowLeft");
      await sortMenu.assertNotAttached();
      await menu.assertFocusedMenuItem("Sort");
    });

    test("THEN Enter invokes the focused item", async ({ mount, page }) => {
      await mount(STORY);
      const table = new PwTable(page);
      const ric = await (await table.cell("ric", 2)).innerText();
      const menu = await table.showContextMenu("ric", 2);

      const sortMenu = await menu.menuItem("Sort").openSubMenu("keyboard");
      await sortMenu.press("ArrowDown");
      await sortMenu.assertFocusedMenuItem("Descending");
      await sortMenu.press("Enter");
      await menu.assertNotAttached();
      await expect(page.getByTestId("menu-action")).toHaveText(
        `sort-dsc:ric:${ric}`,
      );
    });
  });
});
