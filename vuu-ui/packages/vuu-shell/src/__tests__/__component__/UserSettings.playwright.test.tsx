import { expect, test } from "@playwright/experimental-ct-react";
import {
  DefaultUserSettingsForm,
  ScrollableUserSettingsPanel,
  VariedFormControlUserSettingsForm,
} from "../../../../../showcase/src/examples/Shell/UserSettings.examples";

test.describe("Given a single toggle button form control", () => {
  test("should have two buttons, with one selected", async ({ mount }) => {
    const component = await mount(<DefaultUserSettingsForm />);

    await expect(
      component.locator("button", { hasText: "light" }),
    ).toHaveAttribute("aria-checked", "true");
    await expect(
      component.locator("button", { hasText: "dark" }),
    ).toHaveAttribute("aria-checked", "false");
  });

  test.describe("WHEN the toggle buttons are selected", () => {
    test("should become selected", async ({ mount }) => {
      const component = await mount(<DefaultUserSettingsForm />);
      const lightButton = component.locator("button", { hasText: "light" });
      const darkButton = component.locator("button", { hasText: "dark" });

      await darkButton.click();
      await expect(darkButton).toHaveAttribute("aria-checked", "true");
      await expect(lightButton).toHaveAttribute("aria-checked", "false");

      await lightButton.click();
      await expect(lightButton).toHaveAttribute("aria-checked", "true");
      await expect(darkButton).toHaveAttribute("aria-checked", "false");
    });
  });
});

test.describe("Given a form with multiple form controls of different types", () => {
  test("the button element should have the correct attributes", async ({
    mount,
  }) => {
    const component = await mount(<VariedFormControlUserSettingsForm />);
    const themeMode = component.locator('[data-field="themeMode"]');

    await expect(
      themeMode.locator("button", { hasText: "dark" }),
    ).toHaveAttribute("aria-checked", "false");
    await expect(
      themeMode.locator("button", { hasText: "light" }),
    ).toHaveAttribute("aria-checked", "true");
  });

  test("the dropdown elements should have the correct attributes", async ({
    mount,
  }) => {
    const component = await mount(<VariedFormControlUserSettingsForm />);

    await expect(
      component
        .locator('[data-field="dateFormatPattern"]')
        .getByRole("combobox"),
    ).toHaveAttribute("role", "combobox");
    await expect(
      component.locator('[data-field="region"]').getByRole("combobox"),
    ).toHaveAttribute("role", "combobox");
  });

  test("the switch element should have the correct attributes", async ({
    mount,
  }) => {
    const component = await mount(<VariedFormControlUserSettingsForm />);

    await expect(component.locator(".saltSwitch-input")).toHaveAttribute(
      "type",
      "checkbox",
    );
  });

  test.describe("WHEN the dropdown is changed", () => {
    test("should change the displayed text on the dropdown", async ({
      mount,
      page,
    }) => {
      const component = await mount(<VariedFormControlUserSettingsForm />);
      const dateFormat = component
        .locator('[data-field="dateFormatPattern"]')
        .getByRole("combobox");
      const region = component
        .locator('[data-field="region"]')
        .getByRole("combobox");

      for (const value of ["mm/dd/yyyy", "dd MM yyyy", "dd/mm/yyyy"]) {
        await dateFormat.click();
        await page.getByRole("option", { name: value, exact: true }).click();
        await expect(dateFormat).toHaveText(value);
      }

      for (const value of [
        "Asia Pacific",
        "Europe, Middle East & Africa",
        "US",
      ]) {
        await region.click();
        await page.getByRole("option", { name: value, exact: true }).click();
        await expect(region).toHaveText(value);
      }
    });
  });

  test.describe("WHEN the switch form control is clicked", () => {
    test("should become checked", async ({ mount }) => {
      const component = await mount(<VariedFormControlUserSettingsForm />);
      const field = component.locator('[data-field="greyscale"]');
      const checkbox = field.locator("input.saltSwitch-input");

      await checkbox.click();

      await expect(checkbox).toBeChecked();
      await expect(field.locator("label.saltSwitch")).toContainClass(
        "saltSwitch-checked",
      );
    });
  });
});

test.describe("Given a form with a large number of components", () => {
  test("should scroll", async ({ mount }) => {
    const component = await mount(<ScrollableUserSettingsPanel />);
    const panel = component.locator(".vuuUserSettingsPanel");

    const isVisibleInPanel = (selector: string) =>
      panel.evaluate((element, childSelector) => {
        const child = element.querySelector(childSelector);
        if (child === null) {
          return false;
        }
        const childRect = child.getBoundingClientRect();
        const panelRect = element.getBoundingClientRect();
        return (
          childRect.top >= panelRect.top && childRect.bottom <= panelRect.bottom
        );
      }, selector);

    await expect
      .poll(() => isVisibleInPanel('[data-field="field1"]'))
      .toBe(true);
    await expect
      .poll(() => isVisibleInPanel('[data-field="field45"]'))
      .toBe(false);

    await panel.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });

    await expect
      .poll(() => isVisibleInPanel('[data-field="field1"]'))
      .toBe(false);
    await expect
      .poll(() => isVisibleInPanel('[data-field="field45"]'))
      .toBe(true);

    await panel.evaluate((element) => {
      element.scrollTop = 0;
    });
    await expect
      .poll(() => isVisibleInPanel('[data-field="field1"]'))
      .toBe(true);
  });
});
