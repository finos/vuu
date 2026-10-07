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
