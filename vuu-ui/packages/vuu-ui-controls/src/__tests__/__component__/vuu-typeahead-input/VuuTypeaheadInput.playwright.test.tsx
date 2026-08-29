import { expect, test } from "@playwright/test";


test.describe("VuuTypeaheadInput", () => {
  test.describe("Given a TypeaheadInput that shows currency suggestions and allows free text", () => {
    test.describe("Then a matched input pattern will show currency suggestions", () => {
      test("first of which can be selected to commit by pressing Enter", async ({
        browserName,
        mount,
        page,
      }) => {
        // The dispatchEvent used to simulate ArrowDown to highlight first option
        // doesn't work in Safari
        test.skip(browserName === "webkit");

        await mount(
          "UiControls/VuuTypeaheadInput/CurrencyWithTypeaheadAllowFreeText",
        );

        const combobox = page.getByRole("combobox");
        await combobox.click();
        await expect(combobox).toBeFocused();
        await combobox.press("G");

        // Wait for listbox to appear
        const listbox = page.getByRole("listbox");
        await expect(listbox).toBeVisible();

        const options = page.getByRole("option");
        await expect(options).toHaveCount(2);

        // The first option will be highlighted
        const firstOption = options.nth(0);
        await expect(firstOption).toHaveText("GBP");
        await expect(firstOption).toContainClass("saltOption-active");
        await expect(firstOption).toContainClass("saltOption-focusVisible");

        await combobox.press("Enter");

        // Verify commit was called
        await expect(page.getByTestId("commit-handler-called")).toHaveValue(
          "true",
        );
        await expect(page.getByTestId("commit-value")).toHaveValue("GBP");

        await expect(combobox).toBeFocused();

        // Verify listbox is hidden
        await expect(listbox).not.toBeVisible();
      });

      test("any of which can be selected (and committed) by clicking", async ({
        mount,
        page,
      }) => {
        await mount(
          "UiControls/VuuTypeaheadInput/CurrencyWithTypeaheadAllowFreeText",
        );

        const combobox = page.getByRole("combobox");
        await combobox.fill("G");

        const listbox = page.getByRole("listbox");
        await expect(listbox).toBeVisible();

        const options = page.getByRole("option");
        await expect(options).toHaveCount(2);

        // Click on second option
        await options.nth(1).click();

        // Verify commit was called
        await expect(page.getByTestId("commit-handler-called")).toHaveValue(
          "true",
        );
        await expect(page.getByTestId("commit-value")).toHaveValue("GBX");

        // Verify listbox is hidden
        await expect(listbox).not.toBeVisible();
      });

      test("which can be navigated with Arrow key", async ({
        browserName,
        mount,
        page,
      }) => {
        // The dispatchEvent used to simukate ArrowDown to highlight first option
        // doesn't work in Safari
        test.skip(browserName === "webkit");

        const component = await mount(
          "UiControls/VuuTypeaheadInput/CurrencyWithTypeaheadAllowFreeText",
        );

        const combobox = page.getByRole("combobox");
        await combobox.fill("G");

        const listbox = page.getByRole("listbox");
        await expect(listbox).toBeVisible();

        const options = page.getByRole("option");
        await expect(options).toHaveCount(2);

        const firstOption = options.nth(0);
        await expect(firstOption).toContainClass("saltOption-active");
        await expect(firstOption).toContainClass("saltOption-focusVisible");

        // Navigate to second option
        await combobox.press("ArrowDown");
        const secondOption = options.nth(1);
        await expect(secondOption).toContainClass("saltOption-active");
        await expect(secondOption).toContainClass("saltOption-focusVisible");

        // Select second option
        await combobox.press("Enter");

        // Verify commit was called
        await expect(page.getByTestId("commit-handler-called")).toHaveValue(
          "true",
        );
        await expect(page.getByTestId("commit-value")).toHaveValue("GBX");

        await expect(combobox).toBeFocused();

        // Verify listbox is hidden
        await expect(listbox).not.toBeVisible();
      });

      test("a complete match will always show one suggestion, Enter commits", async ({
        mount,
        page,
      }) => {
        const component = await mount(
          "UiControls/VuuTypeaheadInput/CurrencyWithTypeaheadAllowFreeText",
        );

        const combobox = page.getByRole("combobox");
        await combobox.fill("GBP");

        const listbox = page.getByRole("listbox");
        await expect(listbox).toBeVisible();

        const options = page.getByRole("option");
        await expect(options).toHaveCount(1);

        const option = options.nth(0);
        await expect(option).toContainClass("saltOption-active");
        await expect(option).toContainClass("saltOption-focusVisible");

        await combobox.press("Enter");

        // Verify commit was called
        await expect(page.getByTestId("commit-handler-called")).toHaveValue(
          "true",
        );
        await expect(page.getByTestId("commit-value")).toHaveValue("GBP");

        // Verify listbox is hidden
        await expect(listbox).not.toBeVisible();
      });
    });

    test.describe("Then a non-matched input pattern will show no suggestions", () => {
      test("and any text can be committed", async ({
        mount,
        page,
        browserName,
      }) => {
        await mount(
          "UiControls/VuuTypeaheadInput/CurrencyWithTypeaheadAllowFreeText",
        );

        const combobox = page.getByRole("combobox");
        await combobox.fill("abc");

        const options = page.getByRole("option");
        await expect(options).toHaveCount(1);

        const disabledOption = options.nth(0);
        await expect(disabledOption).toHaveAttribute("aria-disabled", "true");
        await expect(disabledOption).toHaveText("No matching data");

        // Press Enter and wait for the 200ms timeout
        await combobox.press("Enter");
        await page.waitForTimeout(300); // Wait longer than the 200ms timeout

        // Verify commit was called
        await expect(page.getByTestId("commit-handler-called")).toHaveValue(
          "true",
        );
        await expect(page.getByTestId("commit-value")).toHaveValue("abc");
      });

      test("then clearing previously committed text will automatically commit", async ({
        mount,
        page,
        browserName,
      }) => {
        await mount(
          "UiControls/VuuTypeaheadInput/CurrencyWithTypeaheadAllowFreeText",
        );

        const combobox = page.getByRole("combobox");
        await combobox.fill("abc");

        // Press Enter and wait for the 200ms timeout
        await combobox.press("Enter");
        await page.waitForTimeout(300);

        // Verify first commit
        await expect(page.getByTestId("commit-handler-called")).toHaveValue(
          "true",
        );
        await expect(page.getByTestId("commit-value")).toHaveValue("abc");

        // Clear the text
        await combobox.press("Backspace");
        await combobox.press("Backspace");
        await combobox.press("Backspace");

        // Verify second commit with empty value (this should happen immediately, not with timeout)
        await expect(page.getByTestId("commit-count")).toHaveValue("2");
        await expect(page.getByTestId("commit-value")).toHaveValue("");
      });
    });
  });

  test.describe("Given a TypeaheadInput that shows currency suggestions and DISALLOWS free text", () => {
    test("Then a non-matched input pattern will show no suggestions", async ({
      mount,
      page,
      browserName,
    }) => {
      await mount(
        "UiControls/VuuTypeaheadInput/CurrencyWithTypeaheadDisallowFreeText",
      );

      const combobox = page.getByRole("combobox");
      await combobox.fill("abc");

      const options = page.getByRole("option");
      await expect(options).toHaveCount(1);

      const disabledOption = options.nth(0);
      await expect(disabledOption).toHaveAttribute("aria-disabled", "true");
      await expect(disabledOption).toHaveText("No matching data");

      // Press Enter - this should NOT call onCommit when allowFreeInput is false
      await combobox.press("Enter");
      await page.waitForTimeout(300);

      // Verify commit was NOT called (this is the correct behavior for DISALLOWS free text)
      await expect(page.getByTestId("commit-handler-called")).toHaveValue(
        "false",
      );

      // Verify that the warning message is now shown instead
      const updatedOptions = page.getByRole("option");
      await expect(updatedOptions).toHaveCount(1);
      const warningOption = updatedOptions.nth(0);
      await expect(warningOption).toHaveAttribute("aria-disabled", "true");
      await expect(warningOption).toContainText(
        "Please select a value from the list of suggestions",
      );
    });

    test("Then commit will not be allowed when input text matches no suggestions", async ({
      mount,
      page,
    }) => {
      await mount(
        "UiControls/VuuTypeaheadInput/CurrencyWithTypeaheadDisallowFreeText",
      );

      const combobox = page.getByRole("combobox");
      await combobox.fill("abc");
      await combobox.press("Enter");

      // Verify commit was not called
      await expect(page.getByTestId("commit-handler-called")).toHaveValue(
        "false",
      );
    });

    test("Then warning will be shown if commit attempted on non matching text", async ({
      mount,
      page,
    }) => {
      await mount(
        "UiControls/VuuTypeaheadInput/CurrencyWithTypeaheadDisallowFreeText",
      );

      const combobox = page.getByRole("combobox");
      await combobox.fill("abc");
      await combobox.press("Enter");

      const options = page.getByRole("option");
      await expect(options).toHaveCount(1);

      const disabledOption = options.nth(0);
      await expect(disabledOption).toHaveAttribute("aria-disabled", "true");

      // Wait for warning message to appear
      await page.waitForTimeout(200);
      await expect(disabledOption).toContainText(
        "Please select a value from the list of suggestions",
      );
    });
  });

  test.describe("Given a TypeaheadInput that shows suggestions with no text input", () => {
    test("Then clicking the input shows suggestions", async ({
      mount,
      page,
    }) => {
      await mount(
        "UiControls/VuuTypeaheadInput/ShowsSuggestionsNoTextRequired",
      );

      const combobox = page.getByRole("combobox");
      await combobox.click();

      const options = page.getByRole("option");
      await expect(options).toHaveCount(5);
    });

    test("Then clicking the trigger shows suggestions", async ({
      mount,
      page,
    }) => {
      await mount(
        "UiControls/VuuTypeaheadInput/ShowsSuggestionsNoTextRequired",
      );

      const triggerButton = page.getByRole("button", { name: "Show options" });
      await triggerButton.click();

      const options = page.getByRole("option");
      await expect(options).toHaveCount(5);
    });
  });
});
