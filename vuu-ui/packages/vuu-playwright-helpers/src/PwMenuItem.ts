import { expect, type Locator } from "@playwright/test";
import { PwComponent } from "./PwComponent";
import { PwContextMenu } from "./PwContextMenu";
import { byId } from "./selector-utils";

/**
 * A single item within a PwContextMenu. Usually obtained from
 * PwContextMenu.menuItem rather than constructed directly.
 *
 * The boolean query methods (hasChildren, isDisabled, hasIcon etc) read the
 * current state and do not retry. For state that changes after an action, use
 * a web-first assertion on `locator`, e.g.
 * `await expect(item.locator).toHaveAttribute("aria-expanded", "true")`.
 *
 * @example
 * test("menu item state", async ({ page }) => {
 *   const menu = await new PwTable(page).showContextMenu("ric", 2);
 *   const item = menu.menuItem("Copy text");
 *   expect(await item.isEnabled()).toBe(true);
 *   expect(await item.hasIcon("edit")).toBe(true);
 *   await item.click();
 * });
 */
export class PwMenuItem extends PwComponent {
  protected readonly defaultCssSelector = '[role="menuitem"]';

  /**
   * The text label of the menu item.
   *
   * @example
   * test("second item is Filter", async ({ page }) => {
   *   const menu = await new PwTable(page).showContextMenu("ric", 2);
   *   expect(await menu.menuItem(1).label()).toEqual("Filter");
   * });
   */
  async label(): Promise<string> {
    return (await this.locator.innerText()).trim();
  }

  /**
   * Does this menu item open a sub menu (aria-haspopup="menu").
   *
   * @example
   * test("Filter has a sub menu", async ({ page }) => {
   *   const menu = await new PwTable(page).showContextMenu("ric", 2);
   *   expect(await menu.menuItem("Filter").hasChildren()).toBe(true);
   *   expect(await menu.menuItem("Copy text").hasChildren()).toBe(false);
   * });
   */
  async hasChildren(): Promise<boolean> {
    return (await this.locator.getAttribute("aria-haspopup")) === "menu";
  }

  /**
   * Is the menu item disabled (aria-disabled="true"). Disabled items cannot be
   * clicked and are skipped by keyboard navigation.
   *
   * @example
   * test("Delete row is disabled", async ({ page }) => {
   *   const menu = await new PwTable(page).showContextMenu("ric", 2);
   *   expect(await menu.menuItem("Delete row").isDisabled()).toBe(true);
   * });
   */
  async isDisabled(): Promise<boolean> {
    return (await this.locator.getAttribute("aria-disabled")) === "true";
  }

  /**
   * Is the menu item enabled. The inverse of isDisabled.
   *
   * @example
   * test("Copy text is enabled", async ({ page }) => {
   *   const menu = await new PwTable(page).showContextMenu("ric", 2);
   *   expect(await menu.menuItem("Copy text").isEnabled()).toBe(true);
   * });
   */
  async isEnabled(): Promise<boolean> {
    return !(await this.isDisabled());
  }

  /**
   * Is the sub menu of this menu item open (aria-expanded="true"). Always
   * false for leaf items.
   *
   * @example
   * test("Filter expands on hover", async ({ page }) => {
   *   const menu = await new PwTable(page).showContextMenu("ric", 2);
   *   const filter = menu.menuItem("Filter");
   *   expect(await filter.isExpanded()).toBe(false);
   *   await filter.openSubMenu();
   *   expect(await filter.isExpanded()).toBe(true);
   * });
   */
  async isExpanded(): Promise<boolean> {
    return (await this.locator.getAttribute("aria-expanded")) === "true";
  }

  /**
   * Does the menu item have DOM focus. Does not wait or retry, prefer
   * PwContextMenu.assertFocusedMenuItem after a key press.
   *
   * @example
   * test("Copy text focused", async ({ page }) => {
   *   const menu = await new PwTable(page).showContextMenu("ric", 2);
   *   await menu.press("ArrowDown");
   *   await menu.assertFocusedMenuItem("Copy text");
   *   expect(await menu.menuItem("Copy text").isFocused()).toBe(true);
   * });
   */
  isFocused(): Promise<boolean> {
    return this.locator.evaluate(
      (element) => element === element.ownerDocument.activeElement,
    );
  }

  /**
   * Is the menu item decorated with the given icon (data-icon attribute).
   *
   * @example
   * test("Copy text has edit icon", async ({ page }) => {
   *   const menu = await new PwTable(page).showContextMenu("ric", 2);
   *   expect(await menu.menuItem("Copy text").hasIcon("edit")).toBe(true);
   * });
   */
  async hasIcon(iconName: string): Promise<boolean> {
    return (await this.locator.getAttribute("data-icon")) === iconName;
  }

  /**
   * Click the menu item. Playwright will not click a disabled item unless
   * { force: true } is passed.
   *
   * @example
   * test("click invokes menu action", async ({ page }) => {
   *   const menu = await new PwTable(page).showContextMenu("ric", 2);
   *   await menu.menuItem("Copy text").click();
   *   await menu.assertNotAttached();
   * });
   *
   * @example
   * test("clicking disabled item does nothing", async ({ page }) => {
   *   const menu = await new PwTable(page).showContextMenu("ric", 2);
   *   await menu.menuItem("Delete row").click({ force: true });
   *   await menu.assertVisible();
   * });
   */
  async click(options?: Parameters<Locator["click"]>[0]): Promise<void> {
    await this.locator.click(options);
  }

  /**
   * Hover over the menu item. Hovering an item with children opens its sub
   * menu, use openSubMenu to also wait for the sub menu.
   *
   * @example
   * test("hover expands Filter", async ({ page }) => {
   *   const menu = await new PwTable(page).showContextMenu("ric", 2);
   *   const filter = menu.menuItem("Filter");
   *   await filter.hover();
   *   await expect(filter.locator).toHaveAttribute("aria-expanded", "true");
   * });
   */
  async hover(): Promise<void> {
    await this.locator.hover();
  }

  /**
   * Give the menu item DOM focus.
   *
   * @example
   * test("focus Sort then open with keyboard", async ({ page }) => {
   *   const menu = await new PwTable(page).showContextMenu("ric", 2);
   *   const sort = menu.menuItem("Sort");
   *   await sort.focus();
   *   await sort.press("ArrowRight");
   *   await expect(sort.locator).toHaveAttribute("aria-expanded", "true");
   * });
   */
  async focus(): Promise<void> {
    await this.locator.focus();
  }

  /**
   * Press a key with the menu item as target. Focuses the item first.
   *
   * @example
   * test("Enter on item invokes action", async ({ page }) => {
   *   const menu = await new PwTable(page).showContextMenu("ric", 2);
   *   await menu.menuItem("Copy text").press("Enter");
   *   await menu.assertNotAttached();
   * });
   */
  async press(key: string): Promise<void> {
    await this.locator.press(key);
  }

  /**
   * The sub menu opened by this menu item. The sub menu must already be open,
   * use openSubMenu to open it.
   *
   * @example
   * test("sub menu opened by hover", async ({ page }) => {
   *   const menu = await new PwTable(page).showContextMenu("ric", 2);
   *   const filter = menu.menuItem("Filter");
   *   await filter.hover();
   *   const filterMenu = await filter.subMenu();
   *   expect(await filterMenu.hasMenuItems()).toBe(true);
   * });
   */
  async subMenu(): Promise<PwContextMenu> {
    const subMenuId = await this.locator.getAttribute("aria-controls");
    if (subMenuId === null) {
      throw Error(
        `PwMenuItem, subMenu, menu item "${await this.label()}" has no open sub menu`,
      );
    }
    return new PwContextMenu(this.page, byId(subMenuId)).isReady();
  }

  /**
   * Open the sub menu of this menu item, using the mouse (hover) or keyboard
   * (ArrowRight). Resolves once the sub menu is visible and, when opened with
   * the keyboard, once focus has moved into the sub menu.
   *
   * @example
   * test("open sub menu with mouse", async ({ page }) => {
   *   const menu = await new PwTable(page).showContextMenu("ric", 2);
   *   const filterMenu = await menu.menuItem("Filter").openSubMenu();
   *   await filterMenu.menuItem("Include value").click();
   *   await menu.assertNotAttached();
   * });
   *
   * @example
   * test("open sub menu with keyboard", async ({ page }) => {
   *   const menu = await new PwTable(page).showContextMenu("ric", 2);
   *   const sortMenu = await menu.menuItem("Sort").openSubMenu("keyboard");
   *   await sortMenu.assertFocusedMenuItem("Ascending");
   *   await sortMenu.press("ArrowLeft");
   *   await sortMenu.assertNotAttached();
   * });
   */
  async openSubMenu(
    using: "mouse" | "keyboard" = "mouse",
  ): Promise<PwContextMenu> {
    if (!(await this.hasChildren())) {
      throw Error(
        `PwMenuItem, openSubMenu, menu item "${await this.label()}" has no sub menu`,
      );
    }
    if (using === "mouse") {
      await this.hover();
    } else {
      await this.focus();
      await this.press("ArrowRight");
    }
    await this.locator
      .and(this.page.locator('[aria-expanded="true"]'))
      .waitFor();
    const subMenu = await this.subMenu();
    if (using === "keyboard") {
      await expect(subMenu.focusedMenuItem.locator).toHaveCount(1);
    }
    return subMenu;
  }
}
