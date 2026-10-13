import type { Page } from "@playwright/test";

export class PlaywrightPageObject {
  constructor(protected readonly page: Page) {}
}
