import { expect, type Locator, type Page } from "@playwright/test";
import { PlaywrightPageObject } from "./PlaywrightPageObject";

/**
 * Identifies the element a component helper operates on. Either a css selector,
 * resolved against the page, or a Locator.
 */
export type PwComponentTarget = string | Locator;

/**
 * Base class for helpers that wrap a single component instance. Subclasses
 * provide a defaultCssSelector, which can be overridden at runtime by passing
 * a css selector or Locator to the constructor.
 *
 * @example
 * // a hypothetical helper for a toolbar component
 * export class PwToolbar extends PwComponent {
 *   protected readonly defaultCssSelector = ".vuuToolbar";
 * }
 *
 * test("toolbar renders", async ({ page }) => {
 *   await new PwToolbar(page).assertVisible();
 *   await new PwToolbar(page, "#main-toolbar").assertVisible();
 *   await new PwToolbar(page, page.getByTestId("toolbar")).assertVisible();
 * });
 */
export abstract class PwComponent extends PlaywrightPageObject {
  protected abstract readonly defaultCssSelector: string;

  /**
   * @param page the Playwright page
   * @param target optional css selector or Locator for the component, overrides defaultCssSelector
   */
  constructor(
    page: Page,
    protected readonly target?: PwComponentTarget,
  ) {
    super(page);
  }

  /**
   * Locator for the component root element. Use this for web-first assertions
   * that are not covered by a helper method.
   *
   * @example
   * test("menu is vertical", async ({ page }) => {
   *   const menu = await new PwTable(page).showContextMenu("ric", 2);
   *   await expect(menu.locator).toHaveAttribute("aria-orientation", "vertical");
   * });
   */
  get locator(): Locator {
    if (typeof this.target === "string" || this.target === undefined) {
      return this.page.locator(this.target ?? this.defaultCssSelector);
    }
    return this.target;
  }

  /**
   * Wait until the component is attached and visible. Resolves with the
   * component, so it can be chained.
   *
   * @example
   * const menu = await new PwContextMenu(page).isReady();
   */
  async isReady(options?: { timeout?: number }): Promise<this> {
    await this.locator.waitFor({ state: "visible", ...options });
    return this;
  }

  /**
   * Is the component currently visible. Does not wait or retry, prefer
   * assertVisible within tests unless the component is known to be stable.
   *
   * @example
   * test("menu is open", async ({ page }) => {
   *   const menu = await new PwTable(page).showContextMenu("ric", 2);
   *   expect(await menu.isVisible()).toBe(true);
   * });
   */
  isVisible(): Promise<boolean> {
    return this.locator.isVisible();
  }

  /**
   * Assert the component is visible, retrying until the expect timeout.
   *
   * @example
   * test("table renders", async ({ mount, page }) => {
   *   await mount("Table/ContextMenu/LocalContextMenu");
   *   await new PwTable(page).assertVisible();
   * });
   */
  async assertVisible(): Promise<void> {
    await expect(this.locator).toBeVisible();
  }

  /**
   * Assert the component is not in the DOM, retrying until the expect timeout.
   * Passes as soon as the element is absent, so it does not prove an element
   * will not appear later (see PwTable.assertNoContextMenu).
   *
   * @example
   * test("menu closes after click", async ({ page }) => {
   *   const menu = await new PwTable(page).showContextMenu("ric", 2);
   *   await menu.menuItem("Copy text").click();
   *   await menu.assertNotAttached();
   * });
   */
  async assertNotAttached(): Promise<void> {
    await expect(this.locator).not.toBeAttached();
  }
}
