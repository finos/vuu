import { expect, type Locator } from "@playwright/test";
import { PwComponent } from "./PwComponent";
import { cssAttributeValue } from "./selector-utils";

/**
 * A ColumnPicker. The upper list holds the columns in view (selected), the
 * lower list the columns available to add. Columns are identified by name
 * (the data-name of the list option), not by display label.
 *
 * @example
 * test("add a column", async ({ page }) => {
 *   const picker = await new PwTableFooter(page).showColumnPicker();
 *   await picker.addColumn("lotSize");
 *   await picker.assertSelectedColumns(["bbg", "currency", "lotSize"]);
 * });
 */
export class PwColumnPicker extends PwComponent {
  protected readonly defaultCssSelector = ".vuuColumnPicker";

  /**
   * Locator for the options in the list of selected columns (columns in view).
   *
   * @example
   * test("four columns in view", async ({ page }) => {
   *   const picker = await new PwTableFooter(page).showColumnPicker();
   *   await expect(picker.selectedOptions).toHaveCount(4);
   * });
   */
  get selectedOptions(): Locator {
    return this.locator.locator(".vuuItemPicker-selectedList [role='option']");
  }

  /**
   * Locator for the options in the list of available columns.
   *
   * @example
   * test("three columns available", async ({ page }) => {
   *   const picker = await new PwTableFooter(page).showColumnPicker();
   *   await expect(picker.availableOptions).toHaveCount(3);
   * });
   */
  get availableOptions(): Locator {
    return this.locator.locator(".vuuItemPicker-availableList [role='option']");
  }

  /**
   * The names of the selected columns (columns in view), in list order.
   *
   * @example
   * test("columns in view", async ({ page }) => {
   *   const picker = await new PwTableFooter(page).showColumnPicker();
   *   expect(await picker.selectedColumns()).toEqual(["bbg", "currency"]);
   * });
   */
  selectedColumns(): Promise<string[]> {
    return this.optionNames(this.selectedOptions);
  }

  /**
   * The names of the available columns, in list order.
   *
   * @example
   * test("columns available", async ({ page }) => {
   *   const picker = await new PwTableFooter(page).showColumnPicker();
   *   expect(await picker.availableColumns()).toContain("lotSize");
   * });
   */
  availableColumns(): Promise<string[]> {
    return this.optionNames(this.availableOptions);
  }

  /**
   * Add a column to the view. Hovers the column in the available list, then
   * clicks its add button.
   *
   * @example
   * test("add lotSize", async ({ page }) => {
   *   const picker = await new PwTableFooter(page).showColumnPicker();
   *   await picker.addColumn("lotSize");
   * });
   */
  async addColumn(columnName: string): Promise<void> {
    await this.clickAction(this.option(this.availableOptions, columnName));
  }

  /**
   * Remove a column from the view. Hovers the column in the selected list,
   * then clicks its remove button.
   *
   * @example
   * test("remove currency", async ({ page }) => {
   *   const picker = await new PwTableFooter(page).showColumnPicker();
   *   await picker.removeColumn("currency");
   * });
   */
  async removeColumn(columnName: string): Promise<void> {
    await this.clickAction(this.option(this.selectedOptions, columnName));
  }

  /**
   * Enter text in the search input, filtering both lists.
   *
   * @example
   * test("search for lot", async ({ page }) => {
   *   const picker = await new PwTableFooter(page).showColumnPicker();
   *   await picker.search("lot");
   *   expect(await picker.availableColumns()).toEqual(["lotSize"]);
   * });
   */
  async search(text: string): Promise<void> {
    await this.locator.getByRole("search").getByRole("textbox").fill(text);
  }

  /**
   * Assert the names of the selected columns, in order, retrying until the
   * expect timeout.
   *
   * @example
   * test("columns in view", async ({ page }) => {
   *   const picker = await new PwTableFooter(page).showColumnPicker();
   *   await picker.assertSelectedColumns(["bbg", "currency"]);
   * });
   */
  async assertSelectedColumns(columnNames: string[]): Promise<void> {
    await expect.poll(() => this.selectedColumns()).toEqual(columnNames);
  }

  /**
   * Assert that the named columns are in the available list, retrying until
   * the expect timeout. Other columns may also be available.
   *
   * @example
   * test("currency is available again", async ({ page }) => {
   *   const picker = await new PwTableFooter(page).showColumnPicker();
   *   await picker.removeColumn("currency");
   *   await picker.assertAvailableColumns(["currency"]);
   * });
   */
  async assertAvailableColumns(columnNames: string[]): Promise<void> {
    await expect
      .poll(() => this.availableColumns())
      .toEqual(expect.arrayContaining(columnNames));
  }

  // The add/remove button is only visible while the option is hovered
  private async clickAction(option: Locator): Promise<void> {
    await option.hover();
    await option.locator(".vuuItemPickerListItem-action").click();
  }

  private option(options: Locator, columnName: string): Locator {
    return options.and(
      this.page.locator(`[data-name="${cssAttributeValue(columnName)}"]`),
    );
  }

  private optionNames(options: Locator): Promise<string[]> {
    return options.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("data-name") ?? ""),
    );
  }
}
