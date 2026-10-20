import { expect, type Page } from "@playwright/test";
import { PwComponent, type PwComponentTarget } from "./PwComponent";

/**
 * A Table column header cell. Usually obtained from PwTable.headerCell.
 *
 * @example
 * test("currency header", async ({ page }) => {
 *   const header = new PwTable(page).headerCell("currency");
 *   await expect(header.locator).toHaveText("Currency");
 * });
 */
export class PwTableHeaderCell extends PwComponent {
  protected readonly defaultCssSelector = ".vuuTableHeaderCell";

  /**
   * @param page the Playwright page
   * @param target css selector or Locator for the header cell
   */
  // biome-ignore lint/complexity/noUselessConstructor: makes target required
  constructor(page: Page, target: PwComponentTarget) {
    super(page, target);
  }

  /**
   * Does the header cell have the selected class. Does not wait or retry,
   * use assertSelected after an action that selects the column.
   *
   * @example
   * test("no column initially selected", async ({ page }) => {
   *   const table = new PwTable(page);
   *   expect(await table.headerCell("currency").isSelected).toBe(false);
   * });
   */
  get isSelected(): Promise<boolean> {
    return this.locator.evaluate((element) =>
      element.classList.contains("vuuTableHeaderCell-selected"),
    );
  }

  /**
   * Assert the header cell is selected, retrying until the expect timeout.
   *
   * @example
   * test("column is selected", async ({ page }) => {
   *   const table = new PwTable(page);
   *   // ...select the currency column
   *   await table.headerCell("currency").assertSelected();
   * });
   */
  async assertSelected(): Promise<void> {
    await expect(this.locator).toContainClass("vuuTableHeaderCell-selected");
  }
}
