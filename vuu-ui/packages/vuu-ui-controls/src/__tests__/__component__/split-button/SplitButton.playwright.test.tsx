import { test, expect } from "@playwright/experimental-ct-react";
import { DefaultSplitButton } from "../../../../../../showcase/src/examples/UiControls/SplitButton.examples";

test.describe("Given a (non segmented) SplitButton", () => {
  test("should have correct tabindex", async ({ mount }) => {
    const component = await mount(
      <DefaultSplitButton data-testid="split-button" />,
    );

    const splitButton = component.getByTestId("split-button");
    await expect(splitButton).toHaveAttribute("tabindex", "-1");

    const buttons = component.getByRole("button");
    const secondaryButton = buttons.nth(1);
    await expect(secondaryButton).toHaveAttribute("aria-haspopup", "menu");
    await expect(secondaryButton).toHaveAttribute("aria-expanded", "false");
    await expect(secondaryButton).toHaveAttribute("tabindex", "-1");
  });

  test.describe("WHEN main button clicked", () => {
    test("THEN main button action is invoked", async ({ mount }) => {
      let clickHandlerCalled = false;
      const clickHandler = () => {
        clickHandlerCalled = true;
      };

      const component = await mount(
        <DefaultSplitButton onClick={clickHandler} />,
      );
      const buttons = component.getByRole("button");
      const mainButton = buttons.nth(0);

      await mainButton.click();
      expect(clickHandlerCalled).toBe(true);
    });
  });

  test.describe("WHEN secondary button clicked", () => {
    test("THEN popup is displayed", async ({ mount, page }) => {
      let clickHandlerCalled = false;
      const clickHandler = () => {
        clickHandlerCalled = true;
      };

      const component = await mount(
        <DefaultSplitButton onClick={clickHandler} />,
      );
      const buttons = component.getByRole("button");
      const secondaryButton = buttons.nth(1);

      // Use dispatchEvent to simulate a click since the button is not visible
      await secondaryButton.dispatchEvent("click");
      expect(clickHandlerCalled).toBe(false);
      // The menu might be rendered in a portal, so check the page instead of just the component
      await expect(page.getByRole("menu")).toBeVisible();
    });
  });

  test.describe("WHEN keyboard navigation used", () => {
    test.describe("AND user tabs to SplitButton", () => {
      test("THEN Main Button is focused", async ({ browserName, mount }) => {
        test.skip(
          browserName === "webkit",
          "Focus seems not to go to button by default in Safari - nested within container with tabIndex='-1'",
        );

        const component = await mount(<DefaultSplitButton />);
        const input = component.getByTestId("input");

        await input.click();
        await input.press("Tab");

        const buttons = component.getByRole("button");
        const mainButton = buttons.nth(0);
        await expect(mainButton).toBeFocused();
      });
    });

    test.describe("AND WHEN ENTER is pressed", () => {
      test("THEN main button is activated", async ({ mount }) => {
        let clickHandlerCalled = false;
        const clickHandler = () => {
          clickHandlerCalled = true;
        };

        const component = await mount(
          <DefaultSplitButton onClick={clickHandler} />,
        );
        const input = component.getByTestId("input");
        const buttons = component.getByRole("button");
        const mainButton = buttons.nth(0);

        await input.click();
        await input.press("Tab");
        // Focus the main button and then press Enter
        await mainButton.focus();
        await mainButton.press("Enter");

        expect(clickHandlerCalled).toBe(true);
      });
    });

    test.describe("OR WHEN Space is pressed", () => {
      test("THEN main button is activated", async ({ mount }) => {
        let clickHandlerCalled = false;
        const clickHandler = () => {
          clickHandlerCalled = true;
        };

        const component = await mount(
          <DefaultSplitButton onClick={clickHandler} />,
        );
        const input = component.getByTestId("input");
        const buttons = component.getByRole("button");
        const mainButton = buttons.nth(0);

        await input.click();
        await input.press("Tab");
        // Focus the main button and then press Space
        await mainButton.focus();
        await mainButton.press(" ");

        expect(clickHandlerCalled).toBe(true);
      });
    });

    test.describe("AND WHEN ArrowDown is pressed", () => {
      test("THEN menu is opened", async ({ mount, page }) => {
        let clickHandlerCalled = false;
        const clickHandler = () => {
          clickHandlerCalled = true;
        };

        const component = await mount(
          <DefaultSplitButton onClick={clickHandler} />,
        );
        const input = component.getByTestId("input");
        const buttons = component.getByRole("button");
        const mainButton = buttons.nth(0);

        await input.click();
        await input.press("Tab");
        // Focus the main button and then press ArrowDown
        await mainButton.focus();
        await mainButton.press("ArrowDown");

        // The menu might be rendered in a portal, so check the page instead of just the component
        await expect(page.getByRole("menu")).toBeVisible();
        const secondaryButton = buttons.nth(1);
        await expect(secondaryButton).toHaveAttribute("aria-expanded", "true");
        expect(clickHandlerCalled).toBe(false);
      });
    });
  });
});
