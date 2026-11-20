import { expect, type Page, test } from "../../../../../playwright/fixtures";

const EXAMPLE = "Filters/FilterBar/FilterBar/ControlledQuickFilterValues";

const quickFilter = (page: Page, column: string) =>
  page.locator(`.vuuQuickFilters-filter[data-field="${column}"]`);

const hostValues = async (page: Page) =>
  JSON.parse(await page.getByTestId("quick-filter-values").inputValue());

const hostCount = (page: Page) => page.getByTestId("quick-filter-count");

const lastAppliedFilter = async (page: Page) =>
  JSON.parse(await page.getByTestId("applied-records").inputValue())?.[0];

const switchColumnSet = (page: Page, name: string) =>
  page.getByRole("radio", { name }).click();

const EUR_FILTER = { column: "currency", op: "=", value: "EUR" };

test.describe("QuickFilters with controlled values", () => {
  test("a controlled value shows in its control and is applied", async ({
    mount,
    page,
  }) => {
    await mount(EXAMPLE);

    await expect(quickFilter(page, "currency")).toHaveAttribute("data-set");
    await expect(
      quickFilter(page, "currency").getByRole("combobox"),
    ).toHaveValue("EUR");
    await expect.poll(() => lastAppliedFilter(page)).toEqual(EUR_FILTER);
  });

  test("the host's onQuickFilterChange is called as well as the FilterBar applying the filter", async ({
    mount,
    page,
  }) => {
    await mount(EXAMPLE);

    await expect(hostCount(page)).toHaveValue("1");
    await expect.poll(() => lastAppliedFilter(page)).toEqual(EUR_FILTER);
  });

  test("a committed value is reported to the host", async ({ mount, page }) => {
    await mount(EXAMPLE);

    const venue = quickFilter(page, "exchange").getByRole("combobox");
    await venue.focus();
    await venue.press("ArrowDown");
    const option = page.getByRole("option").first();
    const exchange = await option.textContent();
    await option.click();

    await expect
      .poll(() => hostValues(page))
      .toEqual({
        currency: { op: "=", value: "EUR" },
        exchange: { op: "=", value: exchange },
      });
    await expect(hostCount(page)).toHaveValue("2");
  });

  test("clearing a control removes its value from the host's values", async ({
    mount,
    page,
  }) => {
    await mount(EXAMPLE);

    await page.getByRole("button", { name: "Clear Ccy" }).click();
    await expect.poll(() => hostValues(page)).toEqual({});
    await expect(hostCount(page)).toHaveValue("0");
  });

  test("with applyHiddenValues, a value on a column outside the bar still applies", async ({
    mount,
    page,
  }) => {
    await mount(EXAMPLE);

    await switchColumnSet(page, "Identifiers");
    await expect(quickFilter(page, "currency")).toHaveCount(0);
    await expect(quickFilter(page, "isin")).toHaveCount(1);
    await expect(page.getByText("Also applied")).toBeVisible();

    await expect(hostCount(page)).toHaveValue("1");
    await expect.poll(() => lastAppliedFilter(page)).toEqual(EUR_FILTER);
  });

  test("a value cleared by the host is not shown when its column comes back", async ({
    mount,
    page,
  }) => {
    await mount(EXAMPLE);

    await switchColumnSet(page, "Identifiers");
    await page.getByRole("button", { name: "Clear Ccy" }).click();
    await expect.poll(() => hostValues(page)).toEqual({});
    await expect(hostCount(page)).toHaveValue("0");

    await switchColumnSet(page, "Listing");
    await expect(quickFilter(page, "currency")).not.toHaveAttribute("data-set");
    await expect(
      quickFilter(page, "currency").getByRole("combobox"),
    ).toHaveValue("");
    await expect(hostCount(page)).toHaveValue("0");
  });
});
