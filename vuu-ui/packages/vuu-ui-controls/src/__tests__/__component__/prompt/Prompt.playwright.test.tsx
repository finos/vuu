import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import {
  BareBonesPrompt,
  ConfirmOnly,
  FocusOnConfirm,
} from "../../../../../../showcase/src/examples/UiControls/Prompt.examples";

test.describe("WHEN rendered with open true", () => {
  test("THEN Prompt renders in portal", async ({ mount, page }) => {
    const component = await mount(<BareBonesPrompt />);
    
    // The dialog might be rendered in a portal, so check the page instead of just the component
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveClass(/vuuPrompt/);
  });
});

test.describe("WHEN configured to show confirm button only, with custom label", () => {
  test("THEN neither the close button nor cancel button will be rendered", async ({ mount, page }) => {
    const component = await mount(<ConfirmOnly />);
    
    // The dialog might be rendered in a portal, so check the page instead of just the component
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    
    const buttons = page.getByRole("button");
    await expect(buttons).toHaveCount(1);
    
    const okButton = page.getByRole("button", { name: "OK" });
    await expect(okButton).toBeVisible();
    await expect(okButton).toBeFocused();
  });
});

test.describe("WHEN configured to focus on confirm", () => {
  test("THEN Prompt renders in portal", async ({ mount, page }) => {
    const component = await mount(<FocusOnConfirm />);
    
    // The dialog might be rendered in a portal, so check the page instead of just the component
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    
    const buttons = page.getByRole("button");
    await expect(buttons).toHaveCount(3);
    
    const confirmButton = page.getByRole("button", { name: "Confirm" });
    await expect(confirmButton).toBeFocused();
  });
});
