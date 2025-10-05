import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import { TestFixtureSimpleOverflowContainer } from "../../../../../../showcase/src/examples/UiControls/OverflowContainer.examples";

test.describe("WHEN it initially renders, with enough space for all items", () => {
  test("THEN all child items will be visible, and none will be marked as wrapped", async ({ mount }) => {
    const component = await mount(<TestFixtureSimpleOverflowContainer width={700} />);
    
    const container = component.getByTestId("overflow-container");
    await expect(container).toHaveClass(/vuuOverflowContainer/);
    await expect(container).not.toHaveClass(/vuuOverflowContainer-wrapContainer-overflowed/);
  });
});

test.describe("WHEN it initially renders, with space for all but one items", () => {
  test("THEN all but one items will be visible, one will be marked as wrapped and overflow Indicator will be visible", async ({ mount }) => {
    const component = await mount(<TestFixtureSimpleOverflowContainer width={600} />);
    
    const container = component.getByTestId("overflow-container");
    const wrapContainer = container.locator("> *").first();
    await expect(wrapContainer).toHaveClass(/vuuOverflowContainer-wrapContainer-overflowed/);
  });
});
