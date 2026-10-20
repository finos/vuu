import { expect, type Page } from "@playwright/test";
import { PwComponent, type PwComponentTarget } from "./PwComponent";

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

  get isSelected(): Promise<boolean> {
    return this.locator.evaluate((element) =>
      element.classList.contains("vuuTableHeaderCell-selected"),
    );
  }

  async assertSelected(): Promise<void> {
    await expect(this.locator).toContainClass("vuuTableHeaderCell-selected");
  }
}
