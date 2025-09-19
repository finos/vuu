import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import {
  TestBareBonesPrompt,
  TestConfirmOnly,
  TestFocusOnConfirm,
} from "./Prompt.test-component";

test.describe("Prompt Component", () => {
  test("renders in portal when open is true", async ({ mount }) => {
    const component = await mount(<TestBareBonesPrompt />);
    
    await expect(component).toBeVisible();
    await expect(component).toHaveClass(/vuuPrompt/);
  });

  test("shows confirm button only with custom label when configured", async ({ mount }) => {
    const component = await mount(<TestConfirmOnly />);
    
    await expect(component).toBeVisible();
    
    const buttons = component.getByRole("button");
    await expect(buttons).toHaveCount(1);
    
    const okButton = component.getByRole("button", { name: "OK" });
    await expect(okButton).toBeVisible();
    await expect(okButton).toBeFocused();
  });

  test("focuses on confirm button when configured", async ({ mount }) => {
    const component = await mount(<TestFocusOnConfirm />);
    
    await expect(component).toBeVisible();
    
    const buttons = component.getByRole("button");
    await expect(buttons).toHaveCount(3);
    
    const confirmButton = component.getByRole("button", { name: "Confirm" });
    await expect(confirmButton).toBeFocused();
  });
});
