import React from "react";
import { test, expect } from "@playwright/experimental-ct-react";
import { TimeRangeFilter } from "../../../../../showcase/src/examples/Filters/FilterContainer.examples";

test.describe("FilterContainer - Time range", () => {
  test("renders time inputs with values", async ({ mount }) => {
    const component = await mount(<TimeRangeFilter />);

    const columnFilter = component.locator(".vuuColumnFilter").first();
    await expect(columnFilter).toBeVisible();

    const inputs = columnFilter.locator("input.vuuTimeInput");
    await expect(inputs).toHaveCount(2);
    await expect(inputs.nth(0)).toHaveValue("00:00:00");
    await expect(inputs.nth(1)).toHaveValue("23:59:59");
  });

  test("updates values programmatically and dispatches input/change", async ({
    mount,
  }) => {
    const component = await mount(<TimeRangeFilter />);

    const columnFilter = component.locator(".vuuColumnFilter").first();
    const inputs = columnFilter.locator("input.vuuTimeInput");
    await expect(inputs).toHaveCount(2);

    await inputs.nth(0).evaluate((el: HTMLInputElement) => {
      el.value = "09:00:00";
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await inputs.nth(1).evaluate((el: HTMLInputElement) => {
      el.value = "17:00:00";
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });

    await expect(inputs.nth(0)).toHaveValue("09:00:00");
    await expect(inputs.nth(1)).toHaveValue("17:00:00");
  });

  test("editing one range input preserves the other value", async ({
    mount,
  }) => {
    const component = await mount(<TimeRangeFilter />);

    const columnFilter = component.locator(".vuuColumnFilter").first();
    const inputs = columnFilter.locator("input.vuuTimeInput");
    await expect(inputs).toHaveCount(2);

    // Set initial distinct values on both inputs
    await inputs.nth(0).evaluate((el: HTMLInputElement) => {
      el.value = "09:00:00";
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await inputs.nth(1).evaluate((el: HTMLInputElement) => {
      el.value = "17:00:00";
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });

    await expect(inputs.nth(0)).toHaveValue("09:00:00");
    await expect(inputs.nth(1)).toHaveValue("17:00:00");

    // Edit the first input and ensure the second remains unchanged
    await inputs.nth(0).evaluate((el: HTMLInputElement) => {
      el.value = "10:00:00";
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });

    await expect(inputs.nth(0)).toHaveValue("10:00:00");
    await expect(inputs.nth(1)).toHaveValue("17:00:00");

    // Now edit the second input and ensure the first remains unchanged
    await inputs.nth(1).evaluate((el: HTMLInputElement) => {
      el.value = "18:00:00";
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });

    await expect(inputs.nth(1)).toHaveValue("18:00:00");
    await expect(inputs.nth(0)).toHaveValue("10:00:00");
  });

  test("keyboard edits update first input via Tab and typing", async ({
    mount,
    page,
  }) => {
    const component = await mount(<TimeRangeFilter />);

    const preTimeinput = component.getByTestId("pre-timeinput");
    const preInput = preTimeinput.locator("input");
    await preInput.focus();
    await preInput.press("Tab");

    const firstTimeInput = component.locator(".vuuTimeInput").first();
    await expect(firstTimeInput).toBeFocused();

    await page.keyboard.press("0");
    await page.keyboard.press("9");
    await page.keyboard.press("0");
    await page.keyboard.press("0");
    await page.keyboard.press("0");
    await page.keyboard.press("0");

    await expect(firstTimeInput).toHaveValue("09:00:00");
  });
});
