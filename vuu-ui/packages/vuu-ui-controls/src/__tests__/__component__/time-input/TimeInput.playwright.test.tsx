import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import { TestTimeInput } from "../../../../../../showcase/src/examples/UiControls/TimeInput.examples";

declare global {
  namespace PlaywrightTest {
    interface Matchers<R> {
      toHaveSelection(start: number, end: number): R;
    }
  }
}
// TODO figure out where we put this to make it shareable
expect.extend({
  async toHaveSelection(locator, start, end) {
    let pass: boolean;
    let selection: [number, number] | undefined = undefined;
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
        : "Failed!\n" + errorName!;

    return {
      message,
      pass,
      name: "toHaveSelection",
      expected: [start, end],
      actual: selection,
    };
  },
});

test.describe("TimeInput", () => {
  test.describe("WHEN uncontrolled", () => {
    test.describe("AND passed no defaultValue", () => {
      test("renders as expected, placeholder shows, value is empty", async ({
        mount,
      }) => {
        const component = await mount(<TestTimeInput />);

        // Wait for component to stabilize (matching Cypress wait)
        await component.waitFor({ timeout: 100 });

        const timeinput = component.getByTestId("timeinput");
        await expect(timeinput).toHaveClass(/vuuTimeInput/);
        await expect(timeinput).toHaveValue("");
      });
    });

    test.describe("AND passed defaultValue", () => {
      test("renders as expected, value is visible, value is as expected", async ({
        mount,
      }) => {
        const component = await mount(
          <TestTimeInput defaultValue="00:00:00" />,
        );

        // Wait for component to stabilize (matching Cypress wait)
        await component.waitFor({ timeout: 100 });

        const timeinput = component.getByTestId("timeinput");
        await expect(timeinput).toHaveClass(/vuuTimeInput/);
        await expect(timeinput).toHaveValue("00:00:00");
      });
    });
  });

  test.describe("focus management", () => {
    test.describe("WHEN focus enters control via keyboard, forwards", () => {
      test("THEN control is focused and hours are selected", async ({
        mount,
      }) => {
        const component = await mount(
          <TestTimeInput defaultValue="00:00:00" />,
        );

        const preTimeinput = component.getByTestId("pre-timeinput");
        const preInput = preTimeinput.locator("input");
        await preInput.focus();
        await preInput.press("Tab");

        const timeinput = component.getByTestId("timeinput");
        await expect(timeinput).toBeFocused();
        await expect(timeinput).toHaveSelection(0, 2);
      });

      test.describe("WHEN left/right arrow keys used", () => {
        test("THEN right arrow key shifts selection right", async ({
          mount,
          browserName,
        }) => {
          const component = await mount(
            <TestTimeInput defaultValue="00:00:00" />,
          );

          const preTimeinput = component.getByTestId("pre-timeinput");
          const preInput = preTimeinput.locator("input");
          await preInput.focus();
          await preInput.press("Tab");

          const timeinput = component.getByTestId("timeinput");
          await expect(timeinput).toBeFocused();
          await expect(timeinput).toHaveSelection(0, 2);

          await timeinput.press("ArrowRight");
          await expect(timeinput).toHaveSelection(3, 5);

          await timeinput.press("ArrowRight");
          await expect(timeinput).toHaveSelection(6, 8);

          // Should stay at end
          await timeinput.press("ArrowRight");
          await expect(timeinput).toHaveSelection(6, 8);
        });

        test("THEN left arrow key shifts selection left", async ({
          mount,
          browserName,
        }) => {
          const component = await mount(
            <TestTimeInput defaultValue="00:00:00" />,
          );

          const preTimeinput = component.getByTestId("pre-timeinput");
          const preInput = preTimeinput.locator("input");
          await preInput.focus();
          await preInput.press("Tab");

          const timeinput = component.getByTestId("timeinput");
          await expect(timeinput).toBeFocused();
          await expect(timeinput).toHaveSelection(0, 2);

          // Navigate to end first
          await timeinput.press("ArrowRight");
          await expect(timeinput).toHaveSelection(3, 5);

          await timeinput.press("ArrowRight");
          await expect(timeinput).toHaveSelection(6, 8);

          // Test left arrow navigation with retry logic
          await timeinput.press("ArrowLeft");
          await expect(timeinput).toHaveSelection(3, 5);

          await timeinput.press("ArrowLeft");
          await expect(timeinput).toHaveSelection(0, 2);

          // Should stay at beginning
          await timeinput.press("ArrowLeft");
          await expect(timeinput).toHaveSelection(0, 2);
        });
      });
    });
  });
});
