import { test } from "@playwright/experimental-ct-react";
import { expect } from "../../../../../playwright/customAssertions";
import { DefaultPopupMenu } from "../../../../../showcase/src/examples/Popups/PopupMenu.examples";

test.describe("Given a PopupMenu", () => {
  test("should apply correct aria attribues", async ({ mount, page }) => {
    await mount(<DefaultPopupMenu />);
    const button = page.getByRole("button", { name: "Popup menu" });
    await expect(button).toHaveAttribute("aria-haspopup", "menu");
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByRole("menu")).not.toBeAttached();
  });
  test.describe("WHEN clicked", () => {
    test("THEN popup is displayed and aria attributes updated", async ({
      mount,
      page,
    }) => {
      await mount(<DefaultPopupMenu />);
      const button = page.getByRole("button", { name: "Popup menu" });
      await button.click();
      await expect(button).toHaveAttribute("aria-expanded", "true");
      await expect(page.getByRole("menu")).toBeInViewport();
    });
  });

  test.describe("WHEN keyboard navigation used", () => {
    test.describe("AND user tabs to PopupMenu", () => {
      test("THEN PopupMenu receives focus", async ({ mount, page }) => {
        await mount(<DefaultPopupMenu />);
        const button = page.getByRole("button", { name: "Popup menu" });
        const input = page.getByTestId("input");
        await input.click();
        await input.press("Tab");
        await expect(button).toBeFocused();
      });
    });
    test.describe("AND WHEN ENTER is pressed", () => {
      test("THEN Menu is displayed", async ({ mount, page }) => {
        await mount(<DefaultPopupMenu />);
        const input = page.getByTestId("input");
        await input.click();
        await input.press("Tab");
        const button = page.getByRole("button", { name: "Popup menu" });
        await expect(button).toBeFocused();
        await button.press("Enter");

        await expect(button).toHaveAttribute("aria-expanded", "true");
        await expect(page.getByRole("menu")).toBeInViewport();
        // when we use keyboard to activate trigger, first menuitem is focused
        await expect(
          page.getByRole("menuitem", { name: "Menu Item 1" }),
        ).toBeFocused();
      });
    });
    test.describe("OR WHEN Space is pressed", () => {
      test("THEN Menu is displayed", async ({ mount, page }) => {
        await mount(<DefaultPopupMenu />);
        const input = page.getByTestId("input");
        await input.click();
        await input.press("Tab");
        const button = page.getByRole("button", { name: "Popup menu" });
        await expect(button).toBeFocused();
        button.press("Space");

        await expect(button).toHaveAttribute("aria-expanded", "true");
        await expect(page.getByRole("menu")).toBeInViewport();
      });
    });
    test.describe("AND if Escape is then pressed", () => {
      test("THEN Menu is hidden", async ({ mount, page }) => {
        await mount(<DefaultPopupMenu />);
        const button = page.getByRole("button", { name: "Popup menu" });
        const input = page.getByTestId("input");
        await input.click();
        await input.press("Tab");
        await expect(button).toBeFocused();
        await button.press("Enter");

        const menuItem = page.getByRole("menuitem", { name: "Menu Item 1" });
        await expect(menuItem).toBeFocused();
        menuItem.press("Escape");

        await expect(button).toHaveAttribute("aria-expanded", "false");
        await expect(page.getByRole("menu")).not.toBeAttached();
        await expect(button).toBeFocused();
      });
    });

    test.describe("OR if user clicks outside the PopupMenu", () => {
      test("THEN Menu is hidden", async ({ mount, page }) => {
        await mount(<DefaultPopupMenu />);
        const button = page.getByRole("button", { name: "Popup menu" });
        await button.click();
        await expect(page.getByRole("menu")).toBeInViewport();
        // CLicking the button again should close menu but currently doesn't
        await page.getByTestId("input").click();
        await expect(page.getByRole("menu")).not.toBeAttached();
      });
    });

    test.describe("OR if user tabs away", () => {
      test("THEN Menu is hidden", async ({ mount, page }) => {
        await mount(<DefaultPopupMenu />);
        const input = page.getByTestId("input");
        await input.click();
        await input.press("Tab");
        const button = page.getByRole("button", { name: "Popup menu" });
        await expect(button).toBeFocused();
        button.press("Enter");
        await expect(page.getByRole("menu")).toBeInViewport();

        const menuItem = page.getByRole("menuitem", { name: "Menu Item 1" });
        await expect(menuItem).toBeFocused();
        menuItem.press("Tab");

        await expect(button).toHaveAttribute("aria-expanded", "false");
        await expect(page.getByRole("menu")).not.toBeAttached();
        await expect(button).not.toBeFocused();
      });
    });
  });

  test.describe("WHEN Enter is pressed, with first menu item highlighted", () => {
    test("THEN arrow key can be used for navigation, on Enter menuActionHandler is invoked", async ({
      mount,
      page,
    }) => {
      const callbacks: unknown[] = [];
      const handler: any = (...args: unknown[]) => callbacks.push(args);
      await mount(<DefaultPopupMenu menuActionHandler={handler} />);

      await page.getByRole("button").click();

      const menu = page.getByRole("menu");
      const menuItem1 = page.getByRole("menuitem", { name: "Menu Item 1" });
      const menuItem2 = page.getByRole("menuitem", { name: "Menu Item 2" });

      await expect(menuItem1).toBeVisible();
      await expect(menuItem1).toBeFocused();

      await menuItem1.press("ArrowDown");
      await expect(menuItem2).toBeFocused();

      await menuItem2.press("Enter");

      expect(callbacks).toHaveLength(1);
      expect(callbacks[0]).toEqual(["action-2"]);
    });
  });
});
