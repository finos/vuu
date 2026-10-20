import { expect, test } from "../../../../../playwright/fixtures";

test.describe("FilterContainer operator examples", () => {
  test("filter output scrolls within a constrained example panel", async ({
    mount,
    page,
  }) => {
    await mount("Filters/FilterContainer/WithMultiClauseFilterAndOperators");
    const container = page.locator(".vuuFilterContainer");
    await container.evaluate((el) => {
      el.style.height = "360px";
      el.style.width = "320px";
    });
    const json = page.getByTestId("aggregated-filter-json");
    const query = page.getByTestId("vuu-filter-query");
    await expect(json).toHaveCSS("overflow", "auto");
    await expect(query).toHaveCSS("overflow", "auto");
    expect(await json.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(
      true,
    );
    expect(await query.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(
      true,
    );
    expect(
      await container.evaluate((el) => el.scrollHeight > el.clientHeight),
    ).toBe(true);
    await query.scrollIntoViewIfNeeded();
    expect(await container.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
    await query.evaluate((el) => {
      el.scrollLeft = el.scrollWidth;
    });
    expect(await query.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
  });

  test("empty time filter initializes a selected value on click and operator selection", async ({
    mount,
    page,
  }) => {
    await mount(
      "Filters/FilterContainer/SimpleFilterContainerEmptyWithOperators",
    );
    const timeFilter = page.locator(".vuuColumnFilter").first();
    const input = timeFilter.getByRole("textbox");
    const expectSelectedTime = async () => {
      await expect(input).toBeFocused();
      await expect(input).toHaveValue("00:00:00");
      await expect(input).toHaveSelection(0, 2);
    };
    await input.click();
    await expectSelectedTime();
    await timeFilter
      .locator('[data-field="operator"]')
      .getByRole("combobox")
      .click();
    await page.getByRole("option", { name: "<=", exact: true }).click();
    await expectSelectedTime();
    await input.press("1");
    await expect(input).toHaveValue("10:00:00");
  });

  test("selecting an operator initializes an untouched time input", async ({
    mount,
    page,
  }) => {
    await mount(
      "Filters/FilterContainer/SimpleFilterContainerEmptyWithOperators",
    );
    const timeFilter = page.locator(".vuuColumnFilter").first();
    const input = timeFilter.getByRole("textbox");
    await expect(input).toHaveValue("");
    await timeFilter
      .locator('[data-field="operator"]')
      .getByRole("combobox")
      .click();
    await page.getByRole("option", { name: "<=", exact: true }).click();
    await expect(input).toBeFocused();
    await expect(input).toHaveValue("00:00:00");
    await expect(input).toHaveSelection(0, 2);
  });

  test("empty container shows varied defaults and custom options", async ({
    mount,
    page,
  }) => {
    await mount(
      "Filters/FilterContainer/SimpleFilterContainerEmptyWithOperators",
    );
    const pickers = page
      .locator('[data-field="operator"]')
      .getByRole("combobox");
    await expect(pickers).toHaveText([">=", "starts", "=", "contains", ">"]);
    await expect(page.getByTestId("vuu-filter-query")).toBeEmpty();
    await pickers.nth(2).click();
    await expect(page.getByRole("option")).toHaveText(["=", "!="]);
  });

  test("simple filter restores its non-equality operator and value", async ({
    mount,
    page,
  }) => {
    await mount("Filters/FilterContainer/WithSimpleFilterAndOperators");
    const currency = page.locator(".vuuColumnFilter").nth(2);
    await expect(
      currency.locator('[data-field="operator"]').getByRole("combobox"),
    ).toHaveText("!=");
    await expect(currency.locator("input")).toHaveValue("GBP");
    await expect(page.getByTestId("vuu-filter-query")).toHaveText(
      'currency != "GBP"',
    );
  });

  test("multi-clause filter restores text operators and an inclusive range", async ({
    mount,
    page,
  }) => {
    await mount("Filters/FilterContainer/WithMultiClauseFilterAndOperators");
    const filters = page.locator(".vuuColumnFilter");
    await expect(
      page.locator('[data-field="operator"]').getByRole("combobox"),
    ).toHaveText([">=", "starts", "!=", "contains", "between-inclusive"]);
    await expect(filters.nth(1).locator("input")).toHaveValue("AA");
    await expect(filters.nth(2).locator("input")).toHaveValue("GBP");
    await expect(filters.nth(3).locator("input")).toHaveValue("XLON");
    const range = filters.nth(4).getByRole("textbox");
    await expect(range.nth(0)).toHaveValue("100");
    await expect(range.nth(1)).toHaveValue("200");
    await expect(page.getByTestId("vuu-filter-query")).toHaveText(
      'bbg starts "AA" and currency != "GBP" and exchange contains "XLON" and (lotSize >= 100 and lotSize <= 200)',
    );
  });
});
