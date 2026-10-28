import type { Locator } from "@playwright/test";
import { PwColumnPicker } from "./PwColumnPicker";
import { PwComponent } from "./PwComponent";

/**
 * A TableFooter, usually rendered below a Table. Holds DataSourceStats and
 * a tray of actions, e.g. the ColumnPickerAction.
 *
 * @example
 * test("footer shows column picker", async ({ page }) => {
 *   const footer = new PwTableFooter(page);
 *   const picker = await footer.showColumnPicker();
 *   await picker.assertVisible();
 * });
 */
export class PwTableFooter extends PwComponent {
  protected readonly defaultCssSelector = ".vuuTableFooter";

  /**
   * An action button in the footer, by accessible name.
   *
   * @example
   * test("column picker action", async ({ page }) => {
   *   const footer = new PwTableFooter(page);
   *   await expect(footer.action("Show column picker")).toBeVisible();
   * });
   */
  action(name: string): Locator {
    return this.locator.getByRole("button", { name, exact: true });
  }

  /**
   * Click the ColumnPickerAction. Resolves with the ColumnPicker once it is
   * visible.
   *
   * @param name accessible name of the action, if not the default
   *
   * @example
   * test("open column picker", async ({ page }) => {
   *   const picker = await new PwTableFooter(page).showColumnPicker();
   *   expect(await picker.selectedColumns()).toContain("bbg");
   * });
   */
  async showColumnPicker(name = "Show column picker"): Promise<PwColumnPicker> {
    await this.action(name).click();
    return new PwColumnPicker(this.page).isReady();
  }
}
