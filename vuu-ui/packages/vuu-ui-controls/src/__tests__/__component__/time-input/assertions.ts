import { expect } from "@playwright/test";

expect.extend({
  async toHaveSelectionStart(locator, expected) {
    if (!locator || typeof locator.evaluate !== "function") {
      return {
        pass: false,
        message: () =>
          `Expected a Playwright Locator, but got ${typeof locator}`,
      };
    }

    const actual = await locator.evaluate((el) => {
      if ("selectionStart" in el) {
        return (el as HTMLInputElement | HTMLTextAreaElement).selectionStart;
      }
      throw new Error("Element does not support selectionStart");
    });

    const pass = actual === expected;
    return {
      pass,
      message: () =>
        pass
          ? `Expected selectionStart not to be ${expected}`
          : `Expected selectionStart to be ${expected}, but got ${actual}`,
    };
  },
});
