import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import { LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";
import {
  CurrencyWithTypeaheadAllowFreeText,
  CurrencyWithTypeaheadDisallowFreeText,
  ShowsSuggestionsNoTextRequired,
} from "../../../../../../showcase/src/examples/UiControls/VuuTypeaheadInput.examples";
import { CommitHandler } from "@vuu-ui/vuu-utils";
import { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";

test.describe("VuuTypeaheadInput", () => {
  test.describe("Given a TypeaheadInput that shows currency suggestions and allows free text", () => {
    test.describe("Then a matched input pattern will show currency suggestions", () => {
      test("first of which can be selected to commit by pressing Enter", async ({ mount, page }) => {
        let commitCalled = false;
        let commitValue: VuuRowDataItemType = "";
        let commitEvent: any = null;
        const onCommit: CommitHandler = (event, value) => {
          commitCalled = true;
          commitValue = value;
          commitEvent = event;
        };

        const component = await mount(
          <LocalDataSourceProvider>
            <CurrencyWithTypeaheadAllowFreeText onCommit={onCommit} />
          </LocalDataSourceProvider>
        );
        
        const combobox = page.getByRole("combobox");
        await combobox.fill("G");
        
        // Wait for listbox to appear
        const listbox = page.getByRole("listbox");
        await expect(listbox).toBeVisible();
        
        const options = page.getByRole("option");
        await expect(options).toHaveCount(2);
        
        // Navigate to first option and select it
        await combobox.press("ArrowUp");
        const firstOption = options.nth(0);
        await expect(firstOption).toHaveClass(/saltOption-active/);
        await expect(firstOption).toHaveClass(/saltOption-focusVisible/);
        
        await combobox.press("Enter");
        
        // Verify commit was called
        expect(commitCalled).toBe(true);
        expect(commitValue).toBe("GBP");
        
        // Verify listbox is hidden
        await expect(listbox).not.toBeVisible();
      });

      test("any of which can be selected (and committed) by clicking", async ({ mount, page }) => {
        let commitCalled = false;
        let commitValue: VuuRowDataItemType = "";
        let commitEvent: any = null;
        const onCommit: CommitHandler = (event, value) => {
          commitCalled = true;
          commitValue = value;
          commitEvent = event;
        };

        const component = await mount(
          <LocalDataSourceProvider>
            <CurrencyWithTypeaheadAllowFreeText onCommit={onCommit} />
          </LocalDataSourceProvider>
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
        expect(commitCalled).toBe(true);
        expect(commitValue).toBe("GBX");
        
        // Verify listbox is hidden
        await expect(listbox).not.toBeVisible();
      });

      test("which can be navigated with Arrow key", async ({ mount, page }) => {
        let commitCalled = false;
        let commitValue: VuuRowDataItemType = "";
        let commitEvent: any = null;
        const onCommit: CommitHandler = (event, value) => {
          commitCalled = true;
          commitValue = value;
          commitEvent = event;
        };

        const component = await mount(
          <LocalDataSourceProvider>
            <CurrencyWithTypeaheadAllowFreeText onCommit={onCommit} />
          </LocalDataSourceProvider>
        );
        
        const combobox = page.getByRole("combobox");
        await combobox.fill("G");
        
        const listbox = page.getByRole("listbox");
        await expect(listbox).toBeVisible();
        
        const options = page.getByRole("option");
        await expect(options).toHaveCount(2);
        
        // Navigate to first option
        await combobox.press("ArrowUp");
        const firstOption = options.nth(0);
        await expect(firstOption).toHaveClass(/saltOption-active/);
        await expect(firstOption).toHaveClass(/saltOption-focusVisible/);
        
        // Navigate to second option
        await combobox.press("ArrowDown");
        const secondOption = options.nth(1);
        await expect(secondOption).toHaveClass(/saltOption-active/);
        await expect(secondOption).toHaveClass(/saltOption-focusVisible/);
        
        // Select second option
        await combobox.press("Enter");
        
        // Verify commit was called
        expect(commitCalled).toBe(true);
        expect(commitValue).toBe("GBX");
        
        // Verify listbox is hidden
        await expect(listbox).not.toBeVisible();
      });

      test("a complete match will always show one suggestion, Enter commits", async ({ mount, page }) => {
        let commitCalled = false;
        let commitValue: VuuRowDataItemType = "";
        let commitEvent: any = null;
        const onCommit: CommitHandler = (event, value) => {
          commitCalled = true;
          commitValue = value;
          commitEvent = event;
        };

        const component = await mount(
          <LocalDataSourceProvider>
            <CurrencyWithTypeaheadAllowFreeText onCommit={onCommit} />
          </LocalDataSourceProvider>
        );
        
        const combobox = page.getByRole("combobox");
        await combobox.fill("GBP");
        
        const listbox = page.getByRole("listbox");
        await expect(listbox).toBeVisible();
        
        const options = page.getByRole("option");
        await expect(options).toHaveCount(1);
        
        // Navigate to option and select it
        await combobox.press("ArrowUp");
        const option = options.nth(0);
        await expect(option).toHaveClass(/saltOption-active/);
        await expect(option).toHaveClass(/saltOption-focusVisible/);
        
        await combobox.press("Enter");
        
        // Verify commit was called
        expect(commitCalled).toBe(true);
        expect(commitValue).toBe("GBP");
        
        // Verify listbox is hidden
        await expect(listbox).not.toBeVisible();
      });
    });

    test.describe("Then a non-matched input pattern will show no suggestions", () => {
      test("and any text can be committed", async ({ mount, page, browserName }) => {
        let commitCalled = false;
        let commitValue: VuuRowDataItemType = "";
        let commitEvent: any = null;
        const onCommit: CommitHandler = (event, value) => {
          commitCalled = true;
          commitValue = value;
          commitEvent = event;
        };

        const component = await mount(
          <LocalDataSourceProvider>
            <CurrencyWithTypeaheadAllowFreeText onCommit={onCommit} />
          </LocalDataSourceProvider>
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
        expect(commitCalled).toBe(true);
        expect(commitValue).toBe("abc");
      });

      test("then clearing previously committed text will automatically commit", async ({ mount, page, browserName }) => {
        let commitCalled = false;
        let commitValue: VuuRowDataItemType = "";
        let commitEvent: any = null;
        const onCommit: CommitHandler = (event, value) => {
          commitCalled = true;
          commitValue = value;
          commitEvent = event;
        };

        const component = await mount(
          <LocalDataSourceProvider>
            <CurrencyWithTypeaheadAllowFreeText onCommit={onCommit} />
          </LocalDataSourceProvider>
        );
        
        const combobox = page.getByRole("combobox");
        await combobox.fill("abc");
        
        // Press Enter and wait for the 200ms timeout
        await combobox.press("Enter");
        await page.waitForTimeout(300);
        
        // Verify first commit
        expect(commitCalled).toBe(true);
        expect(commitValue).toBe("abc");
        
        // Clear the text
        commitCalled = false;
        commitValue = "";
        await combobox.press("Backspace");
        await combobox.press("Backspace");
        await combobox.press("Backspace");
        
        // Verify second commit with empty value (this should happen immediately, not with timeout)
        expect(commitCalled).toBe(true);
        expect(commitValue).toBe("");
      });
    });
  });

  test.describe("Given a TypeaheadInput that shows currency suggestions and DISALLOWS free text", () => {
    test("Then a non-matched input pattern will show no suggestions", async ({ mount, page, browserName }) => {
      let commitCalled = false;
      let commitValue: VuuRowDataItemType = "";
      let commitEvent: any = null;
      const onCommit: CommitHandler = (event, value) => {
        commitCalled = true;
        commitValue = value;
        commitEvent = event;
      };

      const component = await mount(
        <LocalDataSourceProvider>
          <CurrencyWithTypeaheadDisallowFreeText onCommit={onCommit} />
        </LocalDataSourceProvider>
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
      expect(commitCalled).toBe(false);
      
      // Verify that the warning message is now shown instead
      const updatedOptions = page.getByRole("option");
      await expect(updatedOptions).toHaveCount(1);
      const warningOption = updatedOptions.nth(0);
      await expect(warningOption).toHaveAttribute("aria-disabled", "true");
      await expect(warningOption).toContainText("Please select a value from the list of suggestions");
    });

    test("Then commit will not be allowed when input text matches no suggestions", async ({ mount, page }) => {
      let commitCalled = false;
      const onCommit: CommitHandler = () => {
        commitCalled = true;
      };

      const component = await mount(
        <LocalDataSourceProvider>
          <CurrencyWithTypeaheadDisallowFreeText onCommit={onCommit} />
        </LocalDataSourceProvider>
      );
      
      const combobox = page.getByRole("combobox");
      await combobox.fill("abc");
      await combobox.press("Enter");
      
      // Verify commit was not called
      expect(commitCalled).toBe(false);
    });

    test("Then warning will be shown if commit attempted on non matching text", async ({ mount, page }) => {
      let commitCalled = false;
      const onCommit: CommitHandler = () => {
        commitCalled = true;
      };

      const component = await mount(
        <LocalDataSourceProvider>
          <CurrencyWithTypeaheadDisallowFreeText onCommit={onCommit} />
        </LocalDataSourceProvider>
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
      await expect(disabledOption).toContainText("Please select a value from the list of suggestions");
    });
  });

  test.describe("Given a TypeaheadInput that shows suggestions with no text input", () => {
    test("Then clicking the input shows suggestions", async ({ mount, page }) => {
      const component = await mount(
        <LocalDataSourceProvider>
          <ShowsSuggestionsNoTextRequired />
        </LocalDataSourceProvider>
      );
      
      const combobox = page.getByRole("combobox");
      await combobox.click();
      
      const options = page.getByRole("option");
      await expect(options).toHaveCount(5);
    });

    test("Then clicking the trigger shows suggestions", async ({ mount, page }) => {
      const component = await mount(
        <LocalDataSourceProvider>
          <ShowsSuggestionsNoTextRequired />
        </LocalDataSourceProvider>
      );
      
      const triggerButton = page.getByRole("button", { name: "Show options" });
      await triggerButton.click();
      
      const options = page.getByRole("option");
      await expect(options).toHaveCount(5);
    });
  });
});
