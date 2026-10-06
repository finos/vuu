import { test, expect } from "../../../../../playwright/fixtures";



test(`A simple uncontrolled togglefilter with no defaultValue
    shows All by default
    selects correct value when clicked
     `, async ({ mount }) => {
  const component = await mount("Filters/ToggleFilter/SimpleBuySellFilter");

  await expect(component.getByRole("radio")).toHaveCount(3);
  await expect(component.getByRole("radio", { name: "ALL" })).toBeChecked();
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

test(`A simple controlled togglefilter with no defaultValue
    shows All by default
    selects correct value when clicked
     `, async ({ mount }) => {
  const component = await mount(
    "Filters/ToggleFilter/SimpleControlledBuySellFilter",
  );

  await expect(component.getByRole("radio")).toHaveCount(3);
  await expect(component.getByRole("radio", { name: "ALL" })).toBeChecked();
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
  await expect(component.getByRole("radio", { name: "ALL" })).toBeChecked();
  await expect(component.getByRole("radio", { name: "BUY" })).toContainClass(
    "vuuToggleFilter-onlyAvailableValue",
  );
});
