import { expect, type Locator } from "@playwright/test";
import { PwComponent } from "./PwComponent";
import { PwContextMenu } from "./PwContextMenu";
import { byId } from "./selector-utils";

/**
 * A single item within a PwContextMenu. Usually obtained from
 * PwContextMenu.menuItem rather than constructed directly.
 */
export class PwMenuItem extends PwComponent {
  protected readonly defaultCssSelector = '[role="menuitem"]';

  /**
   * The text label of the menu item.
   */
  async label(): Promise<string> {
    return (await this.locator.innerText()).trim();
  }

  /**
   * Does this menu item open a sub menu.
   */
  async hasChildren(): Promise<boolean> {
    return (await this.locator.getAttribute("aria-haspopup")) === "menu";
  }

  async isDisabled(): Promise<boolean> {
    return (await this.locator.getAttribute("aria-disabled")) === "true";
  }

  async isEnabled(): Promise<boolean> {
    return !(await this.isDisabled());
  }

  /**
   * Is the sub menu of this menu item open. Always false for leaf items.
   */
  async isExpanded(): Promise<boolean> {
    return (await this.locator.getAttribute("aria-expanded")) === "true";
  }

  isFocused(): Promise<boolean> {
    return this.locator.evaluate(
      (element) => element === element.ownerDocument.activeElement,
    );
  }

  /**
   * Is the menu item decorated with the given icon (data-icon attribute).
   */
  async hasIcon(iconName: string): Promise<boolean> {
    return (await this.locator.getAttribute("data-icon")) === iconName;
  }

  /**
   * Click the menu item. Playwright will not click a disabled item unless
   * { force: true } is passed.
   */
  async click(options?: Parameters<Locator["click"]>[0]): Promise<void> {
    await this.locator.click(options);
  }

  async hover(): Promise<void> {
    await this.locator.hover();
  }

  async focus(): Promise<void> {
    await this.locator.focus();
  }

  async press(key: string): Promise<void> {
    await this.locator.press(key);
  }

  /**
   * The sub menu opened by this menu item. The sub menu must already be open,
   * use openSubMenu to open it.
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
