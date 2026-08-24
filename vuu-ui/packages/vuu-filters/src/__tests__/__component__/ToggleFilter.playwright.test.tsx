import { test, expect } from "@playwright/test";
import { LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";
import { SaltProvider } from "@salt-ds/core";

import {
  SimpleBuySellFilter,
  SimpleBuySellFilterInitialised,
  SimpleControlledBuySellFilter,
  SimpleControlledBuySellFilterInitialised,
  ControlledBuySellFilterWithBuyOnlyDataSource,
} from "../../../../../showcase/src/examples/Filters/ToggleFilter.examples";

test(`A simple uncontrolled togglefilter with no defaultValue
    shows All by default
    selects correct value when clicked
     `, async ({ mount }) => {
  const component = await mount("Filters/ToggleFilter/SimpleBuySellFilter");

  expect(component.getByRole("radio")).toHaveCount(3);
  expect(component.getByRole("radio", { name: "ALL" })).toBeChecked();
  await component.getByRole("radio", { name: "BUY" }).click();
  expect(component.getByRole("radio", { name: "BUY" })).toBeChecked();
});

test(`A simple uncontrolled togglefilter with a defaultValue
    shows correct value selected
     `, async ({ mount }) => {
  const component = await mount(
    "Filters/ToggleFilter/SimpleBuySellFilterInitialised",
  );

  expect(component.getByRole("radio")).toHaveCount(3);
  expect(component.getByRole("radio", { name: "SELL" })).toBeChecked();
});

test(`A simple controlled togglefilter with no defaultValue
    shows All by default
    selects correct value when clicked
     `, async ({ mount }) => {
  const component = await mount(
    "Filters/ToggleFilter/SimpleControlledBuySellFilter",
  );

  expect(component.getByRole("radio")).toHaveCount(3);
  expect(component.getByRole("radio", { name: "ALL" })).toBeChecked();
  await component.getByRole("radio", { name: "BUY" }).click();
  expect(component.getByRole("radio", { name: "BUY" })).toBeChecked();
});

test(`A simple controlled togglefilter with an initial value
    shows correct value selected
     `, async ({ mount }) => {
  const component = await mount(
    "Filters/ToggleFilter/SimpleControlledBuySellFilterInitialised",
  );

  expect(component.getByRole("radio")).toHaveCount(3);
  expect(component.getByRole("radio", { name: "BUY" })).toBeChecked();
});

test(`A controlled togglefilter with datasource filtered to eliminate one value
    shows correct value selected
     `, async ({ mount }) => {
  const component = await mount(
    "Filters/ToggleFilter/ControlledBuySellFilterWithBuyOnlyDataSource",
  );

  expect(component.getByRole("radio")).toHaveCount(3);
  expect(component.getByRole("radio", { name: "ALL" })).toBeChecked();
  await expect(component.getByRole("radio", { name: "BUY" })).toContainClass(
    "vuuToggleFilter-onlyAvailableValue",
  );
});
