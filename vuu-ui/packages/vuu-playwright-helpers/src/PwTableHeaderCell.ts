import { expect, type Page } from "@playwright/test";
import { PlaywrightPageObject } from "./PlaywrightPageObject";

export class PwTableHeaderCell extends PlaywrightPageObject {
  constructor(
    page: Page,
    private readonly cssSelector: string,
  ) {
    super(page);
  }

  get isSelected(): Promise<boolean> {
    return this.page
      .locator(this.cssSelector)
      .evaluate((element) =>
        element.classList.contains("vuuTableHeaderCell-selected"),
      );
  }

  async assertSelected(): Promise<void> {
    await expect(this.page.locator(this.cssSelector)).toContainClass(
      "vuuTableHeaderCell-selected",
    );
  }
}
