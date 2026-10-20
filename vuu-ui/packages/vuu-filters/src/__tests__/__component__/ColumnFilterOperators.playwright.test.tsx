import { expect, test } from "../../../../../playwright/fixtures";

test.describe("ColumnFilter operator picker", () => {
  test("opens all numeric defaults and commits the selected operator", async ({
    mount,
    page,
  }) => {
    await mount("Filters/ColumnFilter/PriceFilterWithOperators", {
      defaultValue: "100",
    });
    const picker = page
      .locator('[data-field="operator"]')
      .getByRole("combobox");
    await expect(picker).toHaveText("=");
    await expect(picker.getByTestId("ChevronDownIcon")).toBeVisible();
    await picker.click();
    await expect(page.getByRole("option")).toHaveText([
      "=",
      "!=",
      ">",
      ">=",
      "<",
      "<=",
    ]);
    await page.getByRole("option", { name: ">", exact: true }).click();
    await expect(picker).toHaveText(">");
    await expect(
      page.locator(".vuuColumnFilter").getByRole("textbox"),
    ).toBeFocused();
    await expect(page.getByTestId("callback-records")).toHaveValue(
      JSON.stringify([
        [{ name: "price", serverDataType: "double" }, ">", "100"],
      ]),
    );
  });

  test("uses configured order, first-option default and keyboard selection", async ({
    mount,
    page,
  }) => {
    await mount("Filters/ColumnFilter/PriceFilterWithOperators", {
      operators: [">", "<"],
    });
    const picker = page
      .locator('[data-field="operator"]')
      .getByRole("combobox");
    await expect(picker).toHaveText(">");
    await picker.focus();
    await picker.press("ArrowDown");
    await expect(page.getByRole("option")).toHaveText([">", "<"]);
    await picker.press("End");
    await picker.press("Enter");
    await expect(picker).toHaveText("<");
    await expect(
      page.locator(".vuuColumnFilter").getByRole("textbox"),
    ).toBeFocused();
    await expect(page.getByTestId("callback-records")).toHaveValue("[]");
  });

  test("supports text operators without multi-value in", async ({
    mount,
    page,
  }) => {
    await mount("Filters/ColumnFilter/PriceFilterWithOperators", {
      column: { name: "ric", serverDataType: "string" },
      defaultValue: "AA",
    });
    const picker = page
      .locator('[data-field="operator"]')
      .getByRole("combobox");
    await picker.click();
    await expect(page.getByRole("option")).toHaveText([
      "=",
      "!=",
      "starts",
      "ends",
      "contains",
    ]);
    await page.getByRole("option", { name: "contains", exact: true }).click();
    await expect(picker).toHaveText("contains");
    await expect(
      page.locator(".vuuColumnFilter").getByRole("combobox").last(),
    ).toBeFocused();
    await expect(page.getByTestId("callback-records")).toHaveValue(
      JSON.stringify([
        [{ name: "ric", serverDataType: "string" }, "contains", "AA"],
      ]),
    );
  });

  test("reflects controlled changes and transitions between ranges and scalar values", async ({
    mount,
    page,
  }) => {
    await mount("Filters/ColumnFilter/ControlledPriceFilterWithOperators");
    const picker = page
      .locator('[data-field="operator"]')
      .getByRole("combobox");
    const inputs = page.locator(".vuuColumnFilter").getByRole("textbox");
    await page.getByRole("button", { name: "Set less than" }).click();
    await expect(picker).toHaveText("<");
    await expect(inputs).toHaveValue("50");
    await page.getByRole("button", { name: "Set range" }).click();
    await expect(picker).toHaveText("between");
    await expect(inputs).toHaveCount(2);
    await expect(inputs.nth(0)).toHaveValue("10");
    await expect(inputs.nth(1)).toHaveValue("20");
    await picker.click();
    await page.getByRole("option", { name: ">", exact: true }).click();
    await expect(inputs).toHaveCount(1);
    await expect(inputs).toHaveValue("10");
    await expect(inputs).toBeFocused();
  });

  test("container applies comparisons and preserves incomplete range drafts", async ({
    mount,
    page,
  }) => {
    await mount(
      "Filters/ColumnFilter/ContainerManagedPriceFilterWithOperators",
    );
    const picker = page
      .locator('[data-field="operator"]')
      .getByRole("combobox");
    const inputs = page.locator(".vuuColumnFilter").getByRole("textbox");
    const records = page.getByTestId("callback-records");
    await inputs.fill("100");
    await picker.click();
    await page.getByRole("option", { name: ">", exact: true }).click();
    await expect(records).toHaveValue(
      JSON.stringify([
        [{ column: "price", op: "=", value: 100 }],
        [{ column: "price", op: ">", value: 100 }],
      ]),
    );
    await picker.click();
    await page
      .getByRole("option", { name: "between-inclusive", exact: true })
      .click();
    await expect(picker).toHaveText("between-inclusive");
    await expect(inputs.nth(0)).toBeFocused();
    await expect(inputs).toHaveCount(2);
    await expect(inputs.nth(0)).toHaveValue("100");
    await expect(inputs.nth(1)).toHaveValue("");
    await inputs.nth(1).fill("200");
    await inputs.nth(1).press("Enter");
    const commits = JSON.parse(await records.inputValue());
    expect(commits.at(-1)).toEqual([
      {
        op: "and",
        filters: [
          { column: "price", op: ">=", value: 100 },
          { column: "price", op: "<=", value: 200 },
        ],
      },
    ]);
    await expect(picker).toHaveText("between-inclusive");
  });

  test("container restores externally loaded operators, ranges and clears", async ({
    mount,
    page,
  }) => {
    await mount(
      "Filters/ColumnFilter/ContainerManagedPriceFilterWithOperators",
      {
        filter: { column: "price", op: ">", value: 100 },
      },
    );
    const picker = page
      .locator('[data-field="operator"]')
      .getByRole("combobox");
    const inputs = page.locator(".vuuColumnFilter").getByRole("textbox");
    await expect(picker).toHaveText(">");
    await expect(inputs).toHaveValue("100");
    await page.getByRole("button", { name: "Load less than" }).click();
    await expect(picker).toHaveText("<=");
    await expect(inputs).toHaveValue("50");
    await page.getByRole("button", { name: "Load range" }).click();
    await expect(picker).toHaveText("between-inclusive");
    await expect(inputs.nth(0)).toHaveValue("10");
    await expect(inputs.nth(1)).toHaveValue("20");
    await page
      .getByRole("button", { name: "Clear filter", exact: true })
      .click();
    await expect(picker).toHaveText("=");
    await expect(inputs).toHaveCount(1);
    await expect(inputs).toHaveValue("");
  });

  test("keeps a range-only configuration while applying partial ranges", async ({
    mount,
    page,
  }) => {
    await mount(
      "Filters/ColumnFilter/ContainerManagedPriceFilterWithOperators",
      {
        operators: ["between-inclusive"],
      },
    );
    const picker = page
      .locator('[data-field="operator"]')
      .getByRole("combobox");
    const inputs = page.locator(".vuuColumnFilter").getByRole("textbox");
    await inputs.nth(0).fill("100");
    await inputs.nth(1).focus();
    await expect(picker).toHaveText("between-inclusive");
    await expect(inputs.nth(0)).toHaveValue("100");
    await inputs.nth(1).fill("200");
    await inputs.nth(1).press("Enter");
    await expect(picker).toHaveText("between-inclusive");
    await expect(inputs.nth(1)).toHaveValue("200");
  });

  test("preserves a price draft when another column commits", async ({
    mount,
    page,
  }) => {
    await mount(
      "Filters/ColumnFilter/ContainerManagedPriceFilterWithOperators",
      { includeLotSize: true },
    );
    const price = page.locator(".vuuColumnFilter").first();
    const picker = price.getByRole("combobox");
    await price.getByRole("textbox").fill("100");
    await picker.click();
    await page.getByRole("option", { name: "between", exact: true }).click();
    const lotSize = page
      .locator(".vuuColumnFilter")
      .nth(1)
      .getByRole("textbox");
    await lotSize.fill("10");
    await lotSize.press("Enter");
    await expect(picker).toHaveText("between");
    await expect(price.getByRole("textbox").nth(0)).toHaveValue("100");
    await expect(price.getByRole("textbox").nth(1)).toHaveValue("");
  });

  test("restores operator and value from FilterProvider saved filters", async ({
    mount,
    page,
  }) => {
    await mount("Filters/ColumnFilter/SavedPriceFilterWithOperators");
    const picker = page
      .locator('[data-field="operator"]')
      .getByRole("combobox");
    const input = page.locator(".vuuColumnFilter").getByRole("textbox");
    await page.getByRole("button", { name: "Load saved price" }).click();
    await expect(picker).toHaveText(">=");
    await expect(input).toHaveValue("100");
    await page.getByRole("button", { name: "Clear saved price" }).click();
    await expect(picker).toHaveText("=");
    await expect(input).toHaveValue("");
  });

  test("respects disabled and read-only input settings", async ({
    mount,
    page,
  }) => {
    await mount("Filters/ColumnFilter/PriceFilterWithOperators", {
      InputProps: { disabled: true },
    });
    const picker = page
      .locator('[data-field="operator"]')
      .getByRole("combobox");
    await expect(picker).toBeDisabled();
    await mount("Filters/ColumnFilter/PriceFilterWithOperators", {
      InputProps: { readOnly: true },
    });
    await picker.click();
    await expect(page.getByRole("listbox")).not.toBeAttached();
  });

  test("preserves a partial range through local FilterProvider updates", async ({
    mount,
    page,
  }) => {
    await mount("Filters/ColumnFilter/SavedPriceFilterWithOperators");
    const picker = page
      .locator('[data-field="operator"]')
      .getByRole("combobox");
    const inputs = page.locator(".vuuColumnFilter").getByRole("textbox");
    await picker.click();
    await page
      .getByRole("option", { name: "between-inclusive", exact: true })
      .click();
    await inputs.nth(0).fill("100");
    await inputs.nth(1).focus();
    await expect(picker).toHaveText("between-inclusive");
    await expect(inputs.nth(0)).toHaveValue("100");
    await inputs.nth(1).fill("200");
    await inputs.nth(1).press("Enter");
    await expect(picker).toHaveText("between-inclusive");
    await expect(inputs.nth(1)).toHaveValue("200");
  });
});
