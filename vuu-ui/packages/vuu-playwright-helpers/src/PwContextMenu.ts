import { expect, type Locator } from "@playwright/test";
import { PwComponent } from "./PwComponent";
import { PwMenuItem } from "./PwMenuItem";

/**
 * A context menu (or one of its sub menus). Usually obtained from
 * PwTable.showContextMenu.
 *
 * @example
 * test("cell menu", async ({ page }) => {
 *   const table = new PwTable(page);
 *   const menu = await table.showContextMenu("ric", 2);
 *   expect(
 *     await menu.hasMenuItems(["Copy text", "Filter", "Sort", "Delete row"]),
 *   ).toBe(true);
 *   const filterMenu = await menu.menuItem("Filter").openSubMenu();
 *   await filterMenu.menuItem("Include value").click();
 *   await menu.assertNotAttached();
 * });
 */
export class PwContextMenu extends PwComponent {
  protected readonly defaultCssSelector = '.vuuContextMenuPanel[role="menu"]';

  /**
   * Locator for the menu items of this menu. Sub menus are rendered in their
   * own (portalled) panels, so their items are not included.
   *
   * @example
   * test("menu has four items", async ({ page }) => {
   *   const menu = await new PwTable(page).showContextMenu("ric", 2);
   *   await expect(menu.menuItems).toHaveCount(4);
   * });
   */
  get menuItems(): Locator {
    return this.locator.getByRole("menuitem");
  }

  /**
   * The labels of the menu items, in rendered order.
   *
   * @example
   * test("menu items are in expected order", async ({ page }) => {
   *   const menu = await new PwTable(page).showContextMenu("ric", 2);
   *   expect(await menu.menuItemLabels()).toEqual([
   *     "Copy text",
   *     "Filter",
   *     "Sort",
   *     "Delete row",
   *   ]);
   * });
   */
  async menuItemLabels(): Promise<string[]> {
    return (await this.menuItems.allInnerTexts()).map((text) => text.trim());
  }

  /**
   * With no argument, does the menu have any menu items. With labels, does
   * the menu have exactly these menu items, in this order. Labels are compared
   * exactly, a partial list returns false.
   *
   * Does not wait or retry. The menu items are rendered with the menu, so this
   * is safe to call once the menu is ready (e.g. after showContextMenu).
   *
   * @example
   * test("cell menu has expected items", async ({ page }) => {
   *   const menu = await new PwTable(page).showContextMenu("ric", 2);
   *   expect(await menu.hasMenuItems()).toBe(true);
   *   expect(
   *     await menu.hasMenuItems(["Copy text", "Filter", "Sort", "Delete row"]),
   *   ).toBe(true);
   *   // exact match, a partial list is false
   *   expect(await menu.hasMenuItems(["Copy text", "Filter"])).toBe(false);
   * });
   *
   * @example
   * test("sub menu has expected items", async ({ page }) => {
   *   const menu = await new PwTable(page).showContextMenu("ric", 2);
   *   const filterMenu = await menu.menuItem("Filter").openSubMenu();
   *   expect(
   *     await filterMenu.hasMenuItems(["Include value", "Exclude value"]),
   *   ).toBe(true);
   * });
   */
  async hasMenuItems(labels?: string[]): Promise<boolean> {
    if (labels === undefined) {
      return (await this.menuItems.count()) > 0;
    }
    const menuItemLabels = await this.menuItemLabels();
    return (
      menuItemLabels.length === labels.length &&
      menuItemLabels.every((label, i) => label === labels[i])
    );
  }

  /**
   * Menu item by label (exact match), or by 0 based index.
   *
   * @example
   * test("locate menu items", async ({ page }) => {
   *   const menu = await new PwTable(page).showContextMenu("ric", 2);
   *   const copy = menu.menuItem("Copy text");
   *   expect(await copy.isEnabled()).toBe(true);
   *   expect(await menu.menuItem(1).label()).toEqual("Filter");
   * });
   */
  menuItem(labelOrIndex: string | number): PwMenuItem {
    const locator =
      typeof labelOrIndex === "number"
        ? this.menuItems.nth(labelOrIndex)
        : this.menuItems.filter({
            has: this.page.getByText(labelOrIndex, { exact: true }),
          });
    return new PwMenuItem(this.page, locator);
  }

  /**
   * The menu item that currently has keyboard focus. The item must also be the
   * menu's active item (tabindex="0"), which confirms the menu has processed the
   * focus change and is ready for the next key press.
   *
   * @example
   * test("first item focused after ArrowDown", async ({ page }) => {
   *   const menu = await new PwTable(page).showContextMenu("ric", 2);
   *   await menu.press("ArrowDown");
   *   await expect(menu.focusedMenuItem.locator).toHaveText("Copy text");
   * });
   */
  get focusedMenuItem(): PwMenuItem {
    return new PwMenuItem(
      this.page,
      this.menuItems.and(this.page.locator(':focus[tabindex="0"]')),
    );
  }

  /**
   * Assert the focused menu item. Wait on this between key presses, keys
   * pressed before the menu has processed a focus change may be misdirected.
   *
   * @example
   * test("arrow keys move focus", async ({ page }) => {
   *   const menu = await new PwTable(page).showContextMenu("ric", 2);
   *   await menu.press("ArrowDown");
   *   await menu.assertFocusedMenuItem("Copy text");
   *   await menu.press("ArrowDown");
   *   await menu.assertFocusedMenuItem("Filter");
   * });
   */
  async assertFocusedMenuItem(label: string): Promise<void> {
    await expect(this.focusedMenuItem.locator).toHaveText(label);
  }

  /**
   * Press key(s) within the menu. Keys are sent to the focused element, which
   * is assumed to be within the menu. Multiple keys are pressed without waiting
   * for the menu to respond, use assertFocusedMenuItem between key presses where
   * a key depends on the focus change of the previous key.
   *
   * @example
   * test("Enter invokes focused item", async ({ page }) => {
   *   const menu = await new PwTable(page).showContextMenu("ric", 2);
   *   await menu.press("ArrowDown");
   *   await menu.assertFocusedMenuItem("Copy text");
   *   await menu.press("Enter");
   *   await menu.assertNotAttached();
   * });
   */
  async press(...keys: string[]): Promise<void> {
    for (const key of keys) {
      await this.page.keyboard.press(key);
    }
  }

  /**
   * Close the menu by pressing Escape. Resolves once the menu is removed.
   *
   * @example
   * test("Escape closes menu", async ({ page }) => {
   *   const menu = await new PwTable(page).showContextMenu("ric", 2);
   *   await menu.close();
   * });
   */
  async close(): Promise<void> {
    await this.press("Escape");
    await this.assertNotAttached();
  }
}
