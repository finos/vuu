import { test, type Page } from "../../../../../playwright/fixtures";
import { expect } from "../../../../../playwright/fixtures";


const FILTER_CONTAINER = ".vuuCustomFilters-filters";

const addButton = (page: Page) =>
  page.locator(".vuuCustomFilters").getByRole("button", {
    name: "Add filter",
  });

const filterPill = (page: Page, index = 0) =>
  page
    .locator(FILTER_CONTAINER)
    .locator(`.vuuFilterPill[data-index="${index}"]`);

const selectOption = async (page: Page, name: string) => {
  const option = page.getByRole("option", { name, exact: true });
  await option.hover();
  await option.click();
};

const saveFilter = async (
  page: Page,
  column: string,
  operator: string,
  value: string,
) => {
  await addButton(page).click();
  await selectOption(page, column);
  await selectOption(page, operator);
  await selectOption(page, value);
  const save = page.getByRole("button", { name: "Save" });
  await expect(save).toBeFocused();
  await save.click();
};

const finishRenaming = async (page: Page, index = 0, name?: string) => {
  const input = filterPill(page, index).locator(".vuuEditableLabel input");
  await expect(input).toBeFocused();
  if (name) {
    await input.fill(name);
  }
  await input.press("Enter");
};

const openPillMenu = async (page: Page, index = 0) => {
  await filterPill(page, index).locator(".vuuSplitButton-trigger").click();
};

test.describe("FilterBar", () => {
  test("initial render has the expected class and no filters", async ({
    mount,
    page,
  }) => {
    await mount("Filters/FilterBar/FilterBar/DefaultFilterBar");

    await expect(page.getByTestId("filterbar")).toContainClass("vuuFilterBar");
    await expect(page.locator(`${FILTER_CONTAINER} > *`)).toHaveCount(0);
  });

  test("initial active filter state is applied", async ({ mount, page }) => {
    const filter = { column: "currency", op: "!=", value: "CAD" } as const;

    await mount("Filters/FilterBar/FilterBar/DefaultFilterBar", {
      filterState: {
        filters: [{ column: "currency", op: "!=", value: "USD" }],
        activeIndices: [0],
      },
    });

    await expect(
      page.locator(`${FILTER_CONTAINER} .vuuFilterPill`),
    ).toHaveCount(1);
    await expect(filterPill(page)).toContainText("currency");
  });

  test("Add opens an empty editor with the column dropdown focused", async ({
    mount,
    page,
  }) => {
    await mount("Filters/FilterBar/FilterBar/DefaultFilterBar");

    await addButton(page).click();
    await expect(page.locator(`${FILTER_CONTAINER} > *`)).toHaveCount(0);
    await expect(page.locator(".vuuFilterEditor")).toBeVisible();
    await expect(page.getByRole("combobox")).toBeFocused();
    await expect(page.getByRole("combobox")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await expect(page.getByRole("option", { name: "currency" })).toBeVisible();
  });

  test("saving a filter updates state, applies it and starts pill renaming", async ({
    mount,
    page,
  }) => {
    const filter = { column: "currency", op: "=", value: "EUR" };
    await mount("Filters/FilterBar/FilterBar/DefaultFilterBar");

    await saveFilter(page, "currency", "=", "EUR");

    await expect(
      JSON.parse(await page.getByTestId("state-records").inputValue()),
    ).toEqual([{ filters: [filter], activeIndices: [0] }]);
    await expect(
      JSON.parse(await page.getByTestId("applied-records").inputValue()),
    ).toEqual([filter]);
    await expect(page.locator(`${FILTER_CONTAINER} > *`)).toHaveCount(1);
    const editableLabel = filterPill(page).locator(".vuuEditableLabel");
    await expect(editableLabel).toContainClass("vuuEditableLabel-editing");
    await expect(editableLabel.locator("input")).toBeFocused();
  });

  test("committing a pill name updates state, exits edit mode and focuses the pill", async ({
    mount,
    page,
  }) => {
    await mount("Filters/FilterBar/FilterBar/DefaultFilterBar");
    await saveFilter(page, "currency", "=", "EUR");

    await finishRenaming(page, 0, "test");

    await expect(
      JSON.parse(await page.getByTestId("state-records").inputValue()),
    ).toEqual([
      {
        filters: [{ column: "currency", op: "=", value: "EUR", name: "test" }],
        activeIndices: [0],
      },
    ]);
    await expect(
      filterPill(page).locator(".vuuEditableLabel"),
    ).not.toContainClass("vuuEditableLabel-editing");
    await expect(
      filterPill(page).locator(".vuuSplitButton-main"),
    ).toBeFocused();
  });

  test("editing a saved filter preserves its name and applies the new value", async ({
    mount,
    page,
  }) => {
    await mount("Filters/FilterBar/FilterBar/DefaultFilterBar");
    await saveFilter(page, "currency", "=", "EUR");
    await finishRenaming(page, 0, "EditedFilter");

    await openPillMenu(page);
    await page.getByRole("menuitem", { name: "Edit" }).click();
    await selectOption(page, "currency");
    await selectOption(page, "=");
    await selectOption(page, "CAD");
    await page.getByRole("button", { name: "Save" }).click();

    const filter = {
      column: "currency",
      op: "=",
      value: "CAD",
      name: "EditedFilter",
    };
    await expect(
      JSON.parse(await page.getByTestId("state-records").inputValue()),
    ).toEqual([{ filters: [filter], activeIndices: [0] }]);
    await expect(
      JSON.parse(await page.getByTestId("applied-records").inputValue()),
    ).toEqual([filter]);
  });

  test("two active filters are combined, and shift-click deactivates one", async ({
    mount,
    page,
  }) => {
    const filter1 = {
      column: "currency",
      op: "=",
      value: "USD",
      name: "currency",
    };
    const filter2 = {
      column: "exchange",
      op: "=",
      value: "MIL/EUR_IT",
      name: "exchange",
    };
    await mount("Filters/FilterBar/FilterBar/DefaultFilterBar");
    await saveFilter(page, "currency", "=", "USD");
    await finishRenaming(page);
    await saveFilter(page, "exchange", "=", "MIL/EUR_IT");
    await finishRenaming(page, 1);

    await expect(
      JSON.parse(await page.getByTestId("state-records").inputValue()),
    ).toEqual([{ filters: [filter1, filter2], activeIndices: [0, 1] }]);
    await expect(
      JSON.parse(await page.getByTestId("applied-records").inputValue()),
    ).toEqual([
      {
        op: "and",
        filters: [
          expect.objectContaining({
            column: "currency",
            op: "=",
            value: "USD",
          }),
          expect.objectContaining({
            column: "exchange",
            op: "=",
            value: "MIL/EUR_IT",
          }),
        ],
      },
    ]);

    await filterPill(page).click({ modifiers: ["Shift"] });
    await expect(filterPill(page)).toHaveAttribute("aria-checked", "false");
    await expect(filterPill(page, 1)).toHaveAttribute("aria-checked", "true");
    await expect(
      JSON.parse(await page.getByTestId("state-records").inputValue()),
    ).toEqual([{ filters: [filter1, filter2], activeIndices: [1] }]);
    await expect(
      JSON.parse(await page.getByTestId("applied-records").inputValue()),
    ).toEqual([filter2]);
  });

  for (const index of [0, 1]) {
    test(`deleting filter ${index + 1} reindexes and applies the remaining filter`, async ({
      mount,
      page,
    }) => {
      const filter1 = {
        column: "currency",
        op: "=",
        value: "USD",
        name: "currency",
      };
      const filter2 = {
        column: "exchange",
        op: "=",
        value: "MIL/EUR_IT",
        name: "exchange",
      };
      await mount("Filters/FilterBar/FilterBar/DefaultFilterBar");
      await saveFilter(page, "currency", "=", "USD");
      await finishRenaming(page);
      await saveFilter(page, "exchange", "=", "MIL/EUR_IT");
      await finishRenaming(page, 1);

      await openPillMenu(page, index);
      await page.getByRole("menuitem", { name: "Delete" }).click();
      await page.getByRole("button", { name: "Remove" }).click();

      const remaining = index === 0 ? filter2 : filter1;
      await expect(
        page.locator(`${FILTER_CONTAINER} .vuuFilterPill`),
      ).toHaveCount(1);
      await expect(filterPill(page)).toContainText(remaining.name);
      await expect(
        JSON.parse(await page.getByTestId("state-records").inputValue()),
      ).toEqual([{ filters: [remaining], activeIndices: [0] }]);
      await expect(
        JSON.parse(await page.getByTestId("applied-records").inputValue()),
      ).toEqual([remaining]);
    });
  }

  test("keyboard selection advances through column, operator and value to Save", async ({
    mount,
    page,
  }) => {
    await mount("Filters/FilterBar/FilterBar/DefaultFilterBar");
    await page.getByTestId("pre-filterbar").locator("input").focus();
    await page.keyboard.press("Tab");
    await expect(addButton(page)).toBeFocused();
    await page.keyboard.press("Enter");

    const column = page.locator(".vuuFilterClauseColumn input");
    await expect(column).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(page.locator(".saltOption-active")).toHaveText("currency");
    await page.keyboard.press("Enter");
    await expect(column).toHaveValue("currency");

    const operator = page.locator(".vuuFilterClauseOperator input");
    await expect(operator).toBeFocused();
    await expect(operator).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator(".saltOption-active")).toHaveText("=");
    await page.keyboard.press("Enter");
    await expect(operator).toHaveValue("=");

    const value = page.locator(".vuuFilterClauseValue input");
    await expect(value).toBeFocused();
    await expect(value).toHaveAttribute("aria-expanded", "true");
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press("ArrowDown");
    }
    await page.keyboard.press("Enter");
    await expect(value).toHaveValue("USD");
    await expect(page.getByRole("button", { name: "Save" })).toBeFocused();
  });

  const getDate = (kind: "start-today" | "end-today") => {
    const today = new Date();
    today.setHours(
      kind === "start-today" ? 0 : 23,
      kind === "start-today" ? 0 : 59,
      kind === "start-today" ? 0 : 59,
      kind === "start-today" ? 0 : 999,
    );
    return today;
  };

  const dateCases = [
    {
      op: "=",
      expectedValue: () => getDate("start-today").getTime(),
    },
    {
      op: "!=",
      expectedValue: () => getDate("start-today").getTime(),
    },
    {
      op: ">",
      expectedValue: () => getDate("end-today").getTime(),
    },
    {
      op: ">=",
      expectedValue: () => getDate("start-today").getTime(),
    },
    {
      op: "<",
      expectedValue: () => getDate("start-today").getTime(),
    },
    {
      op: "<=",
      expectedValue: () => getDate("end-today").getTime(),
    },
  ];

  for (const { op, expectedValue } of dateCases) {
    test(`date operator ${op} applies the selected UI value`, async ({
      mount,
      page,
    }) => {
      await mount("Filters/FilterBar/FilterBar/DefaultFilterBar");

      await addButton(page).click();
      await selectOption(page, "lastUpdated");
      await selectOption(page, op);
      const dateInput = page.getByRole("textbox", { name: "Start date" });
      await expect(dateInput).toBeFocused();
      await dateInput.press("ArrowDown");
      await page
        .locator(
          ".saltCalendarCarousel-slide:not([aria-hidden]) .saltCalendarDay-today",
        )
        .click();
      await page.keyboard.press("ArrowRight");
      await page.getByRole("button", { name: "Save" }).click();
      await finishRenaming(page);

      const filter = {
        column: "lastUpdated",
        op,
        value: expectedValue(),
      };
      await expect(
        JSON.parse(await page.getByTestId("applied-records").inputValue()),
      ).toEqual([
        expect.objectContaining({
          column: filter.column,
          op: filter.op,
          value: filter.value,
        }),
      ]);
      await expect(
        JSON.parse(await page.getByTestId("state-records").inputValue()),
      ).toEqual([
        { filters: [{ ...filter, name: "lastUpdated" }], activeIndices: [0] },
      ]);
    });
  }

  test("deleting a provided filter calls onFilterDeleted", async ({
    mount,
    page,
  }) => {
    await mount("Filters/FilterBar/FilterBar/FilterBarMultipleFilters");

    await openPillMenu(page);
    await page.getByRole("menuitem", { name: "Delete" }).click();
    await page.getByRole("button", { name: "Remove" }).click();

    await expect(
      JSON.parse(await page.getByTestId("deleted-records").inputValue()),
    ).toEqual([
      {
        column: "currency",
        name: "Filter One",
        op: "=",
        value: "EUR",
      },
    ]);
  });

  test("renaming a provided filter calls onFilterRenamed", async ({
    mount,
    page,
  }) => {
    await mount("Filters/FilterBar/FilterBar/FilterBarMultipleFilters");

    await openPillMenu(page);
    await page.getByRole("menuitem", { name: "Rename" }).click();
    await finishRenaming(page, 0, "Test");

    await expect(
      JSON.parse(await page.getByTestId("renamed-records").inputValue()),
    ).toEqual([
      {
        column: "currency",
        name: "Filter One",
        op: "=",
        value: "EUR",
      },
      "Test",
    ]);
  });
});
