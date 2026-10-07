import { test, expect } from "../../../../../playwright/fixtures";

test(`A simple uncontrolled togglefilter with no defaultValue
    shows All by default
    selects correct value when clicked
     `, async ({ mount }) => {
  const component = await mount("Filters/ToggleFilter/SimpleBuySellFilter");

  await expect(component.getByRole("radio")).toHaveCount(3);
  await expect(component.getByRole("radio", { name: "All" })).toBeChecked();
  await component.getByRole("radio", { name: "BUY" }).click();
  await expect(component.getByRole("radio", { name: "BUY" })).toBeChecked();
});

test(`A simple uncontrolled togglefilter with a defaultValue
    shows correct value selected
     `, async ({ mount }) => {
  const component = await mount(
    "Filters/ToggleFilter/SimpleBuySellFilterInitialised",
  );

  await expect(component.getByRole("radio")).toHaveCount(3);
  await expect(component.getByRole("radio", { name: "SELL" })).toBeChecked();
});

test(`A togglefilter with labels
    uses labels as button text
    commits the value, not the label
     `, async ({ mount }) => {
  const component = await mount(
    "Filters/ToggleFilter/SimpleBuySellFilterWithLabels",
  );

  await expect(component.getByRole("radio")).toHaveCount(3);
  const longButton = component.getByRole("radio", {
    name: "Long",
    exact: true,
  });
  await expect(longButton).toHaveAttribute("value", "BUY");
  await expect(
    component.getByRole("radio", { name: "BUY", exact: true }),
  ).toHaveCount(0);
  await longButton.click();
  await expect(longButton).toBeChecked();
});

test(`A simple controlled togglefilter with no defaultValue
    shows All by default
    selects correct value when clicked
     `, async ({ mount }) => {
  const component = await mount(
    "Filters/ToggleFilter/SimpleControlledBuySellFilter",
  );

  await expect(component.getByRole("radio")).toHaveCount(3);
  await expect(component.getByRole("radio", { name: "All" })).toBeChecked();
  await component.getByRole("radio", { name: "BUY" }).click();
  await expect(component.getByRole("radio", { name: "BUY" })).toBeChecked();
});

test(`A simple controlled togglefilter with an initial value
    shows correct value selected
     `, async ({ mount }) => {
  const component = await mount(
    "Filters/ToggleFilter/SimpleControlledBuySellFilterInitialised",
  );

  await expect(component.getByRole("radio")).toHaveCount(3);
  await expect(component.getByRole("radio", { name: "BUY" })).toBeChecked();
});

test(`A controlled togglefilter with datasource filtered to eliminate one value
    shows correct value selected
     `, async ({ mount }) => {
  const component = await mount(
    "Filters/ToggleFilter/ControlledBuySellFilterWithBuyOnlyDataSource",
  );

  await expect(component.getByRole("radio")).toHaveCount(3);
  await expect(component.getByRole("radio", { name: "All" })).toBeChecked();
  await expect(component.getByRole("radio", { name: "BUY" })).toContainClass(
    "vuuToggleFilter-onlyAvailableValue",
  );
});

test(`A controlled togglefilter with datasource filtered to eliminate one value
    flags the value with no matching data as unavailable
    shows a tooltip on hover
    still allows the unavailable value to be selected
     `, async ({ mount, page }) => {
  const component = await mount(
    "Filters/ToggleFilter/ControlledBuySellFilterWithBuyOnlyDataSource",
  );

  const buyButton = component.getByRole("radio", { name: "BUY" });
  const sellButton = component.getByRole("radio", { name: "SELL" });

  await expect(sellButton).toContainClass("vuuToggleFilter-unavailableValue");
  await expect(buyButton).not.toContainClass(
    "vuuToggleFilter-unavailableValue",
  );
  await expect(
    component.getByRole("radio", { name: "All" }),
  ).not.toContainClass("vuuToggleFilter-unavailableValue");

  await sellButton.hover();
  await expect(page.getByRole("tooltip")).toHaveText("No matching data");

  await buyButton.hover();
  await expect(page.getByRole("tooltip")).toHaveCount(0);

  await sellButton.click();
  await expect(sellButton).toBeChecked();
});

test(`A togglefilter with datasource where all values have data
    flags no values as unavailable
     `, async ({ mount }) => {
  const component = await mount(
    "Filters/ToggleFilter/ControlledBuySellFilterWithDataSource",
  );
  await expect(component.getByRole("radio")).toHaveCount(3);
  await expect(
    component.locator(".vuuToggleFilter-unavailableValue"),
  ).toHaveCount(0);
});

test.describe("availability check when toggle value is applied as DataSource filter", () => {
  test(`selecting a value does not flag the other value as unavailable`, async ({
    mount,
  }) => {
    const component = await mount(
      "Filters/ToggleFilter/BuySellFilterAppliedToDataSource",
    );
    const buyButton = component.getByRole("radio", { name: "BUY" });
    const sellButton = component.getByRole("radio", { name: "SELL" });
    await buyButton.click();
    await expect(buyButton).toBeChecked();
    await expect(sellButton).not.toContainClass(
      "vuuToggleFilter-unavailableValue",
    );
  });

  test(`availability established before filter on column is applied persists`, async ({
    mount,
  }) => {
    const component = await mount(
      "Filters/ToggleFilter/BuySellFilterAppliedToBuyOnlyDataSource",
    );
    const buyButton = component.getByRole("radio", { name: "BUY" });
    const sellButton = component.getByRole("radio", { name: "SELL" });
    await expect(sellButton).toContainClass("vuuToggleFilter-unavailableValue");
    await buyButton.click();
    await expect(buyButton).toBeChecked();
    await expect(sellButton).toContainClass("vuuToggleFilter-unavailableValue");
  });

  test(`with initial filter on column, no values are flagged until filter is removed`, async ({
    mount,
  }) => {
    const component = await mount(
      "Filters/ToggleFilter/BuySellFilterAppliedToBuyOnlyDataSourceInitialised",
    );
    const sellButton = component.getByRole("radio", { name: "SELL" });
    await expect(component.getByRole("radio", { name: "BUY" })).toBeChecked();
    await expect(sellButton).not.toContainClass(
      "vuuToggleFilter-unavailableValue",
    );
    await component.getByRole("radio", { name: "All" }).click();
    await expect(sellButton).toContainClass("vuuToggleFilter-unavailableValue");
  });
});

test.describe("multiple interacting ToggleFilters", () => {
  const UNAVAILABLE = "vuuToggleFilter-unavailableValue";
  test(`selections flag values with no matching data in other filters`, async ({
    mount,
  }) => {
    const component = await mount(
      "Filters/ToggleFilter/MultipleInteractingToggleFilters",
    );
    const sideFilter = component.getByTestId("side-filter");
    const regionFilter = component.getByTestId("region-filter");
    const statusFilter = component.getByTestId("status-filter");
    const sell = sideFilter.getByRole("radio", { name: "SELL" });
    const apac = regionFilter.getByRole("radio", { name: "APAC" });
    const amer = regionFilter.getByRole("radio", { name: "AMER" });
    const cancelled = statusFilter.getByRole("radio", { name: "Cancelled" });

    await expect(component.locator(`.${UNAVAILABLE}`)).toHaveCount(0);

    await apac.click();
    await expect(sell).toContainClass(UNAVAILABLE);
    await expect(sideFilter.getByRole("radio", { name: "BUY" })).toContainClass(
      "vuuToggleFilter-onlyAvailableValue",
    );
    await expect(cancelled).toContainClass(UNAVAILABLE);
    // region is filtered, its availability is not re-checked
    await expect(amer).not.toContainClass(UNAVAILABLE);

    await regionFilter.getByRole("radio", { name: "All" }).click();
    await expect(component.locator(`.${UNAVAILABLE}`)).toHaveCount(0);

    await cancelled.click();
    await expect(sell).toContainClass(UNAVAILABLE);
    await expect(apac).toContainClass(UNAVAILABLE);
    await expect(amer).toContainClass(UNAVAILABLE);
  });
});
