import { expect, type Page, test } from "../../../../../playwright/fixtures";

const FILTER_CONTAINER = ".vuuCustomFilters-filters";

const overflowButton = (page: Page) =>
  page.getByRole("button", { name: /more filter/ });

const visiblePills = (page: Page) =>
  page.locator(`${FILTER_CONTAINER} > .vuuFilterPill:not([data-overflowed])`);

const overflowedPills = (page: Page) =>
  page.locator(`${FILTER_CONTAINER} > .vuuFilterPill[data-overflowed]`);

const quickFiltersToggle = (page: Page) =>
  page.getByRole("button", { name: /^Quick filters/ });

const lastAppliedFilter = async (page: Page) =>
  JSON.parse(await page.getByTestId("applied-records").inputValue());

const toggleQuickFilters = (page: Page) => quickFiltersToggle(page).click();

test.describe("FilterBar overflow", () => {
  test("filters that do not fit move into the overflow menu", async ({
    mount,
    page,
  }) => {
    await mount("Filters/FilterBar/FilterBar/FilterBarOverflow");

    const overflowedCount = await overflowedPills(page).count();
    expect(overflowedCount).toBeGreaterThan(0);
    await expect(overflowedPills(page).first()).toBeHidden();
    await expect(overflowButton(page)).toHaveText(`+${overflowedCount}`);
    expect((await visiblePills(page).count()) + overflowedCount).toBe(9);

    await overflowButton(page).click();
    await expect(
      page.locator(".vuuFilterOverflowMenu-panel").getByRole("menuitem"),
    ).toHaveCount(overflowedCount);
  });

  test("a hidden filter can be applied from the overflow menu", async ({
    mount,
    page,
  }) => {
    await mount("Filters/FilterBar/FilterBar/FilterBarOverflow");

    const hiddenPill = overflowedPills(page).first();
    const name = await hiddenPill.getAttribute("data-text");
    const wasApplied =
      (await hiddenPill.getAttribute("aria-checked")) === "true";

    await overflowButton(page).click();
    await page.getByRole("menuitem", { name: new RegExp(`^${name}`) }).click();
    await page
      .getByRole("menuitem", { name: wasApplied ? "Deactivate" : "Apply" })
      .click();

    await expect(hiddenPill).toHaveAttribute(
      "aria-checked",
      wasApplied ? "false" : "true",
    );
  });

  test("arrow keys move between the Add button, the overflow button and the last visible pill", async ({
    mount,
    page,
  }) => {
    await mount("Filters/FilterBar/FilterBar/FilterBarOverflow");

    const addButton = page.getByRole("button", { name: "Add filter" });
    const lastPill = visiblePills(page).last();
    const lastPillFocused = () =>
      lastPill.evaluate((pill) => pill.contains(document.activeElement));

    await addButton.focus();
    await page.keyboard.press("ArrowLeft");
    await expect(overflowButton(page)).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect.poll(lastPillFocused).toBe(true);
    await page.keyboard.press("ArrowRight");
    await expect(overflowButton(page)).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(addButton).toBeFocused();
  });
});

test.describe("FilterBar quick filters", () => {
  test("the filter icon toggles between saved filters and quick filters", async ({
    mount,
    page,
  }) => {
    await mount("Filters/FilterBar/FilterBar/FullFilters");

    await expect(quickFiltersToggle(page)).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await expect(page.getByRole("textbox", { name: "Search" })).toBeHidden();

    await toggleQuickFilters(page);
    await expect(quickFiltersToggle(page)).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.getByRole("textbox", { name: "Search" })).toBeVisible();
    await expect(page.locator(FILTER_CONTAINER)).toBeHidden();

    await toggleQuickFilters(page);
    await expect(page.locator(FILTER_CONTAINER)).toBeVisible();
  });

  test("the filter icon toggles while its hover summary is open", async ({
    mount,
    page,
  }) => {
    await mount("Filters/FilterBar/FilterBar/FullFilters");

    await quickFiltersToggle(page).hover();
    await expect(page.locator(".vuuHoverOverlay-panel")).toBeVisible();

    // the summary makes the toggle inert, so click by position
    const box = await quickFiltersToggle(page).boundingBox();
    if (box === null) throw Error("toggle has no bounding box");
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

    await expect(quickFiltersToggle(page)).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.locator(".vuuHoverOverlay-panel")).toBeHidden();
  });

  test("a search applies together with the applied saved filter", async ({
    mount,
    page,
  }) => {
    await mount("Filters/FilterBar/FilterBar/FullFilters");

    await toggleQuickFilters(page);
    await page.getByRole("textbox", { name: "Search" }).fill("vod");

    await expect
      .poll(async () => (await lastAppliedFilter(page))?.[0]?.op)
      .toBe("and");
    const [filter] = await lastAppliedFilter(page);
    expect(filter.filters[0]).toEqual({
      column: "currency",
      name: "Euro trades",
      op: "=",
      value: "EUR",
    });
    expect(filter.filters[1].op).toBe("or");
    expect(filter.filters[1].filters[0]).toMatchObject({
      op: "contains",
      value: "vod",
    });
    await expect(quickFiltersToggle(page)).toHaveAccessibleName(
      "Quick filters, 2 filter clauses applied",
    );
  });

  test("clearing the search leaves only the saved filter applied", async ({
    mount,
    page,
  }) => {
    await mount("Filters/FilterBar/FilterBar/FullFilters");

    await toggleQuickFilters(page);
    await page.getByRole("textbox", { name: "Search" }).fill("vod");
    await expect
      .poll(async () => (await lastAppliedFilter(page))?.[0]?.op)
      .toBe("and");

    await page.getByRole("button", { name: "Clear search" }).click();
    await expect
      .poll(async () => (await lastAppliedFilter(page))?.[0])
      .toEqual({
        column: "currency",
        name: "Euro trades",
        op: "=",
        value: "EUR",
      });
  });

  test("ArrowDown in an empty quick filter lists the column values", async ({
    mount,
    page,
  }) => {
    await mount("Filters/FilterBar/FilterBar/FullFilters");

    await toggleQuickFilters(page);
    const currency = page
      .locator('.vuuQuickFilters-filter[data-field="currency"]')
      .getByRole("combobox");
    await currency.focus();
    await currency.press("ArrowDown");

    await expect(page.getByRole("option", { name: "EUR" })).toBeVisible();
    expect(await page.getByRole("option").count()).toBeGreaterThan(1);

    await page.getByRole("option", { name: "EUR" }).click();
    await expect(
      page.locator('.vuuQuickFilters-filter[data-field="currency"]'),
    ).toHaveAttribute("data-set");
  });

  test("the column chooser lists the quick filter columns in order", async ({
    mount,
    page,
  }) => {
    await mount("Filters/FilterBar/FilterBar/FullFilters");

    await toggleQuickFilters(page);
    await page
      .getByRole("button", { name: "Choose quick filter columns" })
      .click();

    await expect(page.getByText("3 columns in view")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Reset to default" }),
    ).toBeVisible();
  });
});

test.describe("FilterBar quick filters with a context panel", () => {
  test("the column chooser opens in the context panel and changes the quick filters", async ({
    mount,
    page,
  }) => {
    await mount("Filters/FilterBar/FilterBar/FullFiltersWithContextPanel");

    await toggleQuickFilters(page);
    await page
      .getByRole("button", { name: "Choose quick filter columns" })
      .click();

    const contextPanel = page.locator(".vuuContextPanel");
    await expect(contextPanel.getByText("Quick filter columns")).toBeVisible();
    await expect(contextPanel.getByText("3 columns in view")).toBeVisible();
    await expect(page.locator(".vuuQuickFilters-columnsPanel")).toHaveCount(0);

    // the remove button shows on hover
    const exchangeItem = contextPanel.locator(
      '.vuuItemPickerListItem[data-name="exchange"]',
    );
    await exchangeItem.hover();
    await exchangeItem.locator(".vuuItemPickerListItem-action").click();

    await expect(contextPanel.getByText("2 columns in view")).toBeVisible();
    await expect(
      page.locator('.vuuQuickFilters-filter[data-field="exchange"]'),
    ).toHaveCount(0);

    await contextPanel
      .getByRole("button", { name: "Reset to default" })
      .click();
    await expect(contextPanel.getByText("3 columns in view")).toBeVisible();
    await expect(
      page.locator('.vuuQuickFilters-filter[data-field="exchange"]'),
    ).toHaveCount(1);
  });
});

test.describe("FilterBar column labels", () => {
  test("filters show column labels and are built with column names", async ({
    mount,
    page,
  }) => {
    await mount("Filters/FilterBar/FilterBar/FullFilters");

    await quickFiltersToggle(page).hover();
    await expect(page.locator(".vuuHoverOverlay-panel")).toContainText(
      'Ccy = "EUR"',
    );
    await page.mouse.move(400, 400);
    await expect(page.locator(".vuuHoverOverlay-panel")).toBeHidden();

    await toggleQuickFilters(page);
    const venue = page.locator(
      '.vuuQuickFilters-filter[data-field="exchange"]',
    );
    await expect(venue.locator(".saltFormFieldLabel")).toHaveText("Venue");

    const venueInput = venue.getByRole("combobox");
    await venueInput.focus();
    await venueInput.press("ArrowDown");
    await page.getByRole("option").first().click();

    await expect
      .poll(async () => (await lastAppliedFilter(page))?.[0]?.op)
      .toBe("and");
    const [filter] = await lastAppliedFilter(page);
    expect(filter.filters[1].column).toBe("exchange");
  });

  test("the filter editor column picker shows column labels", async ({
    mount,
    page,
  }) => {
    await mount("Filters/FilterBar/FilterBar/FullFilters");

    await page.getByRole("button", { name: "Add filter" }).click();
    await expect(page.getByRole("option", { name: "Venue" })).toBeVisible();
    await expect(page.getByRole("option", { name: "exchange" })).toHaveCount(0);

    await page.keyboard.type("ven");
    await page.keyboard.press("Enter");
    await expect(
      page.locator(".vuuFilterClauseColumn").getByRole("combobox"),
    ).toHaveValue("Venue");
  });
});
