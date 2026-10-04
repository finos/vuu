import type { Locator } from "@playwright/test";
import { expect, test } from "../../../../../../playwright/fixtures";

type Mount = (
  story: string,
  props?: Record<string, unknown>,
) => Promise<Locator>;

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
        const component = await mount("UiControls/TimeInput/TestTimeInput");
        const timeinput = component.locator(".vuuTimeInput");
        await expect(timeinput).toHaveValue("");
      });
    });

    test.describe("AND passed defaultValue", () => {
      test("renders as expected, value is visible, value is as expected", async ({
        mount,
      }) => {
        const component = await mount("UiControls/TimeInput/TestTimeInput", {
          defaultValue: "00:00:00",
        });
        const timeinput = component.locator(".vuuTimeInput");
        await expect(timeinput).toHaveValue("00:00:00");
      });
    });
  });

  test.describe("focus management", () => {
    test.describe("WHEN focus enters control via keyboard, forwards", () => {
      test("THEN control is focused and hours are selected", async ({
        mount,
      }) => {
        const component = await mount("UiControls/TimeInput/TestTimeInput", {
          defaultValue: "00:00:00",
        });

        const preTimeinput = component.getByTestId("pre-timeinput");
        const preInput = preTimeinput.locator("input");
        await preInput.focus();
        await preInput.press("Tab");

        const timeinput = component.locator(".vuuTimeInput");
        await expect(timeinput).toBeFocused();
        await expect(timeinput).toHaveSelection(0, 2);
      });

      test.describe("WHEN left/right arrow keys used", () => {
        test("THEN right arrow key shifts selection right", async ({
          mount,
          browserName,
        }) => {
          const component = await mount("UiControls/TimeInput/TestTimeInput", {
            defaultValue: "00:00:00",
          });

          const preTimeinput = component.getByTestId("pre-timeinput");
          const preInput = preTimeinput.locator("input");
          await preInput.focus();
          await preInput.press("Tab");

          const timeinput = component.locator(".vuuTimeInput");
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
          const component = await mount("UiControls/TimeInput/TestTimeInput", {
            defaultValue: "00:00:00",
          });

          const preTimeinput = component.getByTestId("pre-timeinput");
          const preInput = preTimeinput.locator("input");
          await preInput.focus();
          await preInput.press("Tab");

          const timeinput = component.locator(".vuuTimeInput");
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

  test.describe("keyboard input", () => {
    test("when hours entered, selection moved to minutes", async ({
      mount,
      page,
    }) => {
      const component = await mount("UiControls/TimeInput/TestTimeInput", {
        defaultValue: "00:00:00",
      });

      const preTimeinput = component.getByTestId("pre-timeinput");
      const preInput = preTimeinput.locator("input");
      await preInput.focus();
      await preInput.press("Tab");

      const timeinput = component.locator(".vuuTimeInput");
      await expect(timeinput).toBeFocused();
      await expect(timeinput).toHaveSelection(0, 2);

      await page.keyboard.down("1");
      await expect(timeinput).toHaveValue("10:00:00");
      await expect(timeinput).toHaveSelection(1, 2);

      await page.keyboard.down("2");
      await expect(timeinput).toHaveValue("12:00:00");

      await expect(timeinput).toHaveSelection(3, 5);

      await page.keyboard.down("3");
      await expect(timeinput).toHaveValue("12:30:00");
      await expect(timeinput).toHaveSelection(4, 5);

      await page.keyboard.down("5");
      await expect(timeinput).toHaveValue("12:35:00");
      await expect(timeinput).toHaveSelection(6, 8);

      const changeValues = component.getByTestId("time-input-change-values");
      await expect(changeValues).toHaveValue(
        JSON.stringify(["10:00:00", "12:00:00", "12:30:00", "12:35:00"]),
      );

      await timeinput.press("Enter");

      // commit callback
      await expect(
        component.getByTestId("time-input-commit-values"),
      ).toHaveValue(JSON.stringify(["12:35:00"]));
    });
  });

  test.describe("keyboard editing", () => {
    const mountAndFocus = async (
      mount: Mount,
      props: Record<string, unknown> = { defaultValue: "00:00:00" },
    ) => {
      const component = await mount(
        "UiControls/TimeInput/TestTimeInput",
        props,
      );
      const preInput = component.getByTestId("pre-timeinput").locator("input");
      await preInput.focus();
      await preInput.press("Tab");
      const timeinput = component.locator(".vuuTimeInput");
      await expect(timeinput).toBeFocused();
      await expect(timeinput).toHaveSelection(0, 2);
      return { component, timeinput };
    };

    test("ArrowUp/ArrowDown increment and decrement the selected unit, with wrap", async ({
      mount,
    }) => {
      const { timeinput } = await mountAndFocus(mount);
      await timeinput.press("ArrowDown");
      await expect(timeinput).toHaveValue("23:00:00");
      await expect(timeinput).toHaveSelection(0, 2);
      await timeinput.press("ArrowUp");
      await expect(timeinput).toHaveValue("00:00:00");
      await timeinput.press("ArrowRight");
      await timeinput.press("ArrowUp");
      await expect(timeinput).toHaveValue("00:01:00");
      await expect(timeinput).toHaveSelection(3, 5);
    });

    test("typing all six digits enters a complete time", async ({ mount }) => {
      const { component, timeinput } = await mountAndFocus(mount);
      await timeinput.pressSequentially("235959");
      await expect(timeinput).toHaveValue("23:59:59");
      await expect(timeinput).toHaveSelection(6, 8);
      await timeinput.press("Enter");
      await expect(
        component.getByTestId("time-input-commit-values"),
      ).toHaveValue(JSON.stringify(["23:59:59"]));
    });

    test("first digit too large for unit is zero padded", async ({ mount }) => {
      const { timeinput } = await mountAndFocus(mount);
      await timeinput.press("7");
      await expect(timeinput).toHaveValue("07:00:00");
      await expect(timeinput).toHaveSelection(3, 5);
    });

    test("invalid digit is rejected and input marked invalid", async ({
      mount,
    }) => {
      const { component, timeinput } = await mountAndFocus(mount);
      await timeinput.press("2");
      await timeinput.press("5");
      await expect(timeinput).toHaveValue("20:00:00");
      await expect(timeinput).toHaveClass(/vuuTimeInput-invalid/);
      await expect(timeinput).toHaveAttribute("aria-invalid", "true");
      await expect(timeinput).toHaveSelection(1, 2);
      await timeinput.press("3");
      await expect(timeinput).toHaveValue("23:00:00");
      await expect(timeinput).not.toHaveClass(/vuuTimeInput-invalid/);
      await expect(
        component.getByTestId("time-input-change-values"),
      ).toHaveValue(JSON.stringify(["20:00:00", "23:00:00"]));
    });

    test("Backspace clears units, moving selection left", async ({ mount }) => {
      const { timeinput } = await mountAndFocus(mount, {
        defaultValue: "12:34:56",
      });
      await timeinput.press("End");
      await expect(timeinput).toHaveSelection(6, 8);
      await timeinput.press("Backspace");
      await expect(timeinput).toHaveValue("12:34:00");
      await expect(timeinput).toHaveSelection(3, 5);
      await timeinput.press("Backspace");
      await expect(timeinput).toHaveValue("12:00:00");
      await expect(timeinput).toHaveSelection(0, 2);
    });

    test("Enter does not commit when no value has been entered", async ({
      mount,
    }) => {
      const component = await mount("UiControls/TimeInput/TestTimeInput");
      const timeinput = component.locator(".vuuTimeInput");
      await timeinput.focus();
      await expect(timeinput).toHaveValue("");
      await timeinput.press("Enter");
      await expect(
        component.getByTestId("time-input-commit-values"),
      ).toHaveValue(JSON.stringify([]));
    });

    test("focus via Shift+Tab selects hours", async ({ mount }) => {
      const component = await mount("UiControls/TimeInput/TestTimeInput", {
        defaultValue: "12:34:56",
      });
      const postInput = component
        .getByTestId("post-timeinput")
        .locator("input");
      await postInput.focus();
      await postInput.press("Shift+Tab");
      const timeinput = component.locator(".vuuTimeInput");
      await expect(timeinput).toBeFocused();
      await expect(timeinput).toHaveSelection(0, 2);
    });
  });

  test.describe("paste", () => {
    const paste = (locator: Locator, text: string) =>
      locator.evaluate((el, text) => {
        const clipboardData = new DataTransfer();
        clipboardData.setData("text", text);
        el.dispatchEvent(
          new ClipboardEvent("paste", {
            bubbles: true,
            cancelable: true,
            clipboardData,
          }),
        );
      }, text);

    test("valid time is pasted, invalid text is ignored", async ({
      browserName,
      mount,
    }) => {
      test.skip(
        browserName === "firefox",
        "Firefox ignores clipboardData passed to ClipboardEvent constructor",
      );
      const component = await mount("UiControls/TimeInput/TestTimeInput", {
        defaultValue: "00:00:00",
      });
      const timeinput = component.locator(".vuuTimeInput");
      await timeinput.focus();
      await paste(timeinput, "x12:34:56");
      await expect(timeinput).toHaveValue("00:00:00");
      await paste(timeinput, "12:34:56");
      await expect(timeinput).toHaveValue("12:34:56");
      await expect(
        component.getByTestId("time-input-change-values"),
      ).toHaveValue(JSON.stringify(["12:34:56"]));
    });
  });

  test.describe("mouse", () => {
    test("click selects the unit under the pointer", async ({ mount }) => {
      const component = await mount("UiControls/TimeInput/TestTimeInput", {
        defaultValue: "12:34:56",
      });
      const timeinput = component.locator(".vuuTimeInput");
      const box = await timeinput.boundingBox();
      if (!box) throw Error("no bounding box");
      // click at far right of text, i.e. within seconds
      const caretPos = await timeinput.evaluate((el: HTMLInputElement) => {
        const span = document.createElement("span");
        const style = getComputedStyle(el);
        span.style.font = style.font;
        span.style.position = "absolute";
        span.textContent = "12:34:5";
        document.body.appendChild(span);
        const width = span.getBoundingClientRect().width;
        span.remove();
        return (
          width +
          parseFloat(style.paddingLeft) +
          parseFloat(style.borderLeftWidth)
        );
      });
      await timeinput.click({ position: { x: caretPos, y: box.height / 2 } });
      await expect(timeinput).toBeFocused();
      await expect(timeinput).toHaveSelection(6, 8);
      await timeinput.press("ArrowUp");
      await expect(timeinput).toHaveValue("12:34:57");
    });
  });

  test.describe("WHEN controlled", () => {
    test("THEN typing updates value via owner", async ({ mount }) => {
      const component = await mount("UiControls/TimeInput/TestTimeInput", {
        value: "09:00:00",
      });
      const timeinput = component.locator(".vuuTimeInput");
      await expect(timeinput).toHaveValue("09:00:00");
      const preInput = component.getByTestId("pre-timeinput").locator("input");
      await preInput.focus();
      await preInput.press("Tab");
      await expect(timeinput).toHaveSelection(0, 2);

      await timeinput.press("1");
      await expect(timeinput).toHaveValue("10:00:00");
      await expect(timeinput).toHaveSelection(1, 2);
      await timeinput.press("5");
      await expect(timeinput).toHaveValue("15:00:00");
      await expect(timeinput).toHaveSelection(3, 5);
      await timeinput.press("ArrowUp");
      await expect(timeinput).toHaveValue("15:01:00");
      await expect(timeinput).toHaveSelection(3, 5);
      await timeinput.press("Backspace");
      await expect(timeinput).toHaveValue("15:00:00");
      await expect(timeinput).toHaveSelection(0, 2);
    });

    test("THEN rejected changes are not displayed", async ({ mount }) => {
      const component = await mount("UiControls/TimeInput/TestTimeInput", {
        rejectChanges: true,
        value: "09:00:00",
      });
      const timeinput = component.locator(".vuuTimeInput");
      const preInput = component.getByTestId("pre-timeinput").locator("input");
      await preInput.focus();
      await preInput.press("Tab");
      await timeinput.press("1");
      await timeinput.press("ArrowUp");
      await expect(
        component.getByTestId("time-input-change-values"),
      ).toHaveValue(JSON.stringify(["10:00:00", "10:00:00"]));
      await expect(timeinput).toHaveValue("09:00:00");
    });
  });
});
