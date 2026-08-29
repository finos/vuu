import { test } from "@playwright/test";
import { expect } from "@playwright/test";


test.describe("FilterClause", () => {
  test("new clause renders the column field focused with suggestions", async ({
    mount,
    page,
  }) => {
    const component = await mount("Filters/FilterClause/NewFilterClause");

    await expect(page.getByTestId("filterclause")).toContainClass(
      "vuuFilterClause",
    );
    await expect(component.locator(".vuuFilterClauseField")).toHaveCount(1);
    await expect(component.locator("input")).toBeFocused();
    await expect(page.getByRole("option", { name: "currency" })).toBeVisible();
  });

  test("partial clause renders column, operator and focused value suggestions", async ({
    mount,
    page,
  }) => {
    const component = await mount(
      "Filters/FilterClause/PartialFilterClauseColumnAndOperator",
    );

    await expect(component.locator(".vuuFilterClauseField")).toHaveCount(3);
    await expect(
      component.locator(".vuuFilterClauseValue input"),
    ).toBeFocused();
    await expect(page.getByRole("option", { name: "GBP" })).toBeVisible();
  });

  test("openDropdownOnFocus false leaves a new column dropdown closed", async ({
    mount,
    page,
  }) => {
    const component = await mount(
      "Filters/FilterClause/NewFilterClauseWithDropdownOpenOnFocusDisabled",
    );

    await expect(component.locator(".vuuFilterClauseField")).toHaveCount(1);
    await expect(
      component.locator(".vuuFilterClauseColumn input"),
    ).toBeFocused();
    await expect(page.getByRole("listbox")).not.toBeAttached();
  });

  test("openDropdownOnFocus false leaves an operator dropdown closed", async ({
    mount,
    page,
  }) => {
    const component = await mount(
      "Filters/FilterClause/FilterColumnWithDropdownOpenOnFocusDisabled",
    );

    await expect(component.locator(".vuuFilterClauseField")).toHaveCount(2);
    await expect(
      component.locator(".vuuFilterClauseOperator input"),
    ).toBeFocused();
    await expect(page.getByRole("listbox")).not.toBeAttached();
  });

  test("openDropdownOnFocus false leaves a value dropdown closed", async ({
    mount,
    page,
  }) => {
    const component = await mount(
      "Filters/FilterClause/FilterColumnAndOperatorWithDropdownOpenOnFocusDisabled",
    );

    await expect(component.locator(".vuuFilterClauseField")).toHaveCount(3);
    await expect(
      component.locator(".vuuFilterClauseValue input"),
    ).toBeFocused();
    await expect(page.getByRole("listbox")).not.toBeAttached();
  });
});
