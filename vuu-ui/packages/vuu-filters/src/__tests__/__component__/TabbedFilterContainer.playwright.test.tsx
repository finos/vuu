import { test, expect } from "@playwright/experimental-ct-react";
import {
  MultipleTabbedFilterContainers,
  SingleTabbedFilterContainers,
} from "../../../../../showcase/src/examples/Filters/TabbedFilterContainer.examples";
import {
  SavedFilterPanelOneFilter,
  SavedFilterPanelFiveFiltersCustomStyles,
} from "../../../../../showcase/src/examples/Filters/SavedFilters/SavedFilterPanel.examples";
import { LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";
import { SaltProvider } from "@salt-ds/core";

test.describe("Given two TabbedFilterContainers with different values for filterProvider", () => {
  test(`When a filter value is entered 
      Then the local clear and save buttons are enabled
      Then when clear is pressed
      Value is cleared and buttons are disabled`, async ({ mount, page }) => {
    const component = await mount(
      <LocalDataSourceProvider>
        <MultipleTabbedFilterContainers />
      </LocalDataSourceProvider>,
    );

    const combobox = page.getByTestId("ccy-1").getByRole("combobox");
    const clearButton1 = component
      .getByRole("button", { name: "clear" })
      .nth(0);
    const saveButton1 = component.getByRole("button", { name: "save" }).nth(0);
    const clearButton2 = component
      .getByRole("button", { name: "clear" })
      .nth(1);
    const saveButton2 = component.getByRole("button", { name: "save" }).nth(1);
    await combobox.click();
    const option = page.getByRole("option").first();
    await option.click();

    expect(combobox).toHaveValue("CAD");
    expect(clearButton1).toBeEnabled();
    expect(saveButton1).toBeEnabled();
    expect(clearButton2).toBeDisabled();
    expect(saveButton2).toBeDisabled();

    await clearButton1.click();

    expect(combobox).toHaveValue("");

    expect(clearButton1).toBeDisabled();
    expect(saveButton1).toBeDisabled();
    expect(clearButton2).toBeDisabled();
    expect(saveButton2).toBeDisabled();
  });

  test(`When a filter value is entered 
      And Saved Filters Tab selected 
      Then no Filter pills are present`, async ({ mount, page }) => {
    await mount(
      <SaltProvider>
        <LocalDataSourceProvider>
          <MultipleTabbedFilterContainers />
        </LocalDataSourceProvider>
      </SaltProvider>,
    );

    const combobox = page.getByTestId("ccy-1").getByRole("combobox");
    await combobox.click();
    const option = page.getByRole("option").first();
    await option.click();
    expect(combobox).toHaveValue("CAD");

    const tab = page.getByTestId("tc-1").getByRole("tab").nth(1);
    await tab.click();
    await expect(
      page.getByTestId("tc-1").locator(".vuuFilterPillNext"),
    ).toHaveCount(0);
  });

  test(`When two filters are entered and save button pressed 
      Then the save dialog is displayed with focus in input
      Press Cancel, dialog is closed`, async ({ mount, page }) => {
    const component = await mount(
      <LocalDataSourceProvider>
        <MultipleTabbedFilterContainers />
      </LocalDataSourceProvider>,
    );

    await page.getByTestId("ccy-1").getByRole("combobox").click();
    await page.getByRole("option").first().click();

    await page.getByTestId("exchange-1").getByRole("combobox").click();
    await page.getByRole("option").first().click();

    await page
      .getByTestId("tc-1")
      .getByRole("button", { name: "save" })
      .click();

    await expect(page.getByRole("dialog")).toBeInViewport();
    const dialog = page.getByRole("dialog");
    expect(dialog.getByRole("heading", { name: "Save Filter" })).toBeVisible();
    await expect(dialog.getByPlaceholder("Please enter")).toBeFocused();

    await expect(dialog.getByRole("button", { name: "cancel" })).toBeEnabled();
    await expect(dialog.getByRole("button", { name: "save" })).toBeDisabled();

    await dialog.getByRole("button", { name: "cancel" }).click();
    await expect(page.getByRole("dialog")).not.toBeInViewport();
  });

  test.describe("Filter name validation default behaviour", () => {
    test(`When a filter is saved
      Then the filter name is allowed a max length of 25 characters
      `, async ({ mount, page }) => {
      const component = await mount(
        <LocalDataSourceProvider>
          <SingleTabbedFilterContainers />
        </LocalDataSourceProvider>,
      );

      await page.getByTestId("ccy-1").getByRole("combobox").click();
      await page.getByRole("option").first().click();

      await page
        .getByTestId("tc-1")
        .getByRole("button", { name: "save" })
        .click();

      await expect(page.getByRole("dialog")).toBeInViewport();
      const dialog = page.getByRole("dialog");
      expect(
        dialog.getByRole("heading", { name: "Save Filter" }),
      ).toBeVisible();
      await expect(dialog.getByPlaceholder("Please enter")).toBeFocused();
      await dialog.getByPlaceholder("Please enter").fill("A".repeat(30));
      await expect(dialog.getByPlaceholder("Please enter")).toHaveValue(
        "A".repeat(25),
      );
    });

    test(`When a saved filter is renamed
      Then the filter name is allowed a max length of 25 characters
      `, async ({ mount, page }) => {
      const component = await mount(
        <SavedFilterPanelFiveFiltersCustomStyles />,
      );

      await page
        .getByRole("button", { name: "TEST FILTER 1" })
        .click({ button: "right" });

      await page.getByRole("menuitem", { name: "Rename" }).click();

      await expect(page.getByRole("dialog")).toBeInViewport();
      const dialog = page.getByRole("dialog");
      expect(
        dialog.getByRole("heading", { name: "Rename Filter" }),
      ).toBeVisible();
      await expect(dialog.getByPlaceholder("Please enter")).toBeFocused();
      await expect(dialog.getByPlaceholder("Please enter")).toHaveValue(
        "Test Filter 1",
      );
      await dialog.getByPlaceholder("Please enter").fill("A".repeat(30));
      await expect(dialog.getByPlaceholder("Please enter")).toHaveValue(
        "A".repeat(25),
      );
    });
  });

  test.describe("Filter name validation with max length set in the FilterProvider", () => {
    test(`When a filter is saved
      Then the filter name is allowed a max length of 20 characters
      `, async ({ mount, page }) => {
      const component = await mount(
        <LocalDataSourceProvider>
          <MultipleTabbedFilterContainers />
        </LocalDataSourceProvider>,
      );

      await page.getByTestId("ccy-1").getByRole("combobox").click();
      await page.getByRole("option").first().click();

      await page
        .getByTestId("tc-1")
        .getByRole("button", { name: "save" })
        .click();

      await expect(page.getByRole("dialog")).toBeInViewport();
      const dialog = page.getByRole("dialog");
      expect(
        dialog.getByRole("heading", { name: "Save Filter" }),
      ).toBeVisible();
      await expect(dialog.getByPlaceholder("Please enter")).toBeFocused();
      await dialog.getByPlaceholder("Please enter").fill("A".repeat(25));
      await expect(dialog.getByPlaceholder("Please enter")).toHaveValue(
        "A".repeat(20),
      );
    });

    test(`When a saved filter is renamed
      Then the filter name is allowed a max length of 20 characters
      `, async ({ mount, page }) => {
      const component = await mount(<SavedFilterPanelOneFilter />);

      await page
        .getByRole("button", { name: "TEST FILTER" })
        .click({ button: "right" });

      await page.getByRole("menuitem", { name: "Rename" }).click();

      await expect(page.getByRole("dialog")).toBeInViewport();
      const dialog = page.getByRole("dialog");
      expect(
        dialog.getByRole("heading", { name: "Rename Filter" }),
      ).toBeVisible();
      await expect(dialog.getByPlaceholder("Please enter")).toBeFocused();
      await expect(dialog.getByPlaceholder("Please enter")).toHaveValue(
        "Test Filter",
      );
      await dialog.getByPlaceholder("Please enter").fill("A".repeat(25));
      await expect(dialog.getByPlaceholder("Please enter")).toHaveValue(
        "A".repeat(20),
      );
    });
  });
});
