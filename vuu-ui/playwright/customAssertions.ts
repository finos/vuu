import { expect as baseExpect } from "@playwright/experimental-ct-react";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace PlaywrightTest {
    interface Matchers<R> {
      toHaveSelection(start: number, end: number): R;
    }
  }
}

export const expect = baseExpect.extend({
  async toHaveSelection(locator, start, end) {
    let pass: boolean;
    const selection: [number, number] | undefined = undefined;
    let errorName: string | undefined;

    try {
      await expect
        .poll(
          async () => {
            return await locator.evaluate((el: object) => {
              const { selectionStart, selectionEnd } = el as HTMLInputElement;
              return [selectionStart, selectionEnd];
            });
          },
          { timeout: 1000 },
        )
        .toEqual([start, end]);
      pass = true;
    } catch (error) {
      errorName = (error as Error).message.replace(
        "toEqual",
        "toHaveSelection",
      );
      pass = false;
    }
    const message = () =>
      pass
        ? (errorName ? `\x1b[31m${errorName} for \x1b[0m` : "") +
          this.utils.matcherHint("toHaveSelection", undefined, undefined, {
            isNot: this.isNot,
          }) +
          "\n\n" +
          `Locator: ${locator}\n` +
          `Expected: ${this.isNot ? "not" : ""} ${this.utils.printExpected([start, end])}\n` +
          (selection ? `Received: ${this.utils.printReceived(selection)}` : "")
        : "Failed!\n" + (errorName ?? "");

    return {
      message,
      pass,
      name: "toHaveSelection",
      expected: [start, end],
      actual: selection,
    };
  },
});
