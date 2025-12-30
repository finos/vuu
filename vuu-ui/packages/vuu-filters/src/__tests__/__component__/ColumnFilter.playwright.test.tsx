import { test } from "@playwright/experimental-ct-react";
import { LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";
import { expect } from "../../../../../playwright/customAssertions";

import {
  ContainerManagedNumericColumnFilter,
  ContainerManagedTextColumnFilter,
  ControlledTextColumnFilter,
  ControlledTextColumnFilterPopulated,
  ControlledNumericRangeFilter,
  ControlledTimeRangeFilter,
  UnControlledNumericColumnFilter,
  UnControlledTextColumnFilter,
} from "../../../../../showcase/src/examples/Filters/ColumnFilter.examples";
import {
  ColumnFilterChangeHandler,
  ColumnFilterCommitHandler,
  FilterContainerFilter,
} from "@vuu-ui/vuu-filter-types";
import { ColumnFilterProps } from "../../column-filter/ColumnFilter";
import { FilterAppliedHandler } from "../../filter-container/useFilterContainer";

const BBG = { name: "bbg", serverDataType: "string" };
const PRICE = { name: "price", serverDataType: "double" };
const VUU_CREATED = {
  name: "vuuCreatedTimestamp",
  serverDataType: "long",
  type: "time",
};

test.describe("ColumnFilter", () => {
  test.describe("TextColumnFilter", () => {
    test(`Controlled Text ColumnFilter rendered empty, search pattern entered and value selected from search results, correct callbacks are invoked`, async ({
      mount,
      page,
    }) => {
      const values: unknown[] = [];
      const onChange: ColumnFilterChangeHandler = (...args) =>
        values.push(args);
      const onCommit: ColumnFilterCommitHandler = (...args) =>
        values.push(args);

      await mount(
        <LocalDataSourceProvider>
          <ControlledTextColumnFilter
            onColumnFilterChange={onChange}
            onCommit={onCommit}
          />
        </LocalDataSourceProvider>,
      );

      const columnFilter = page.locator(".vuuColumnFilter");
      expect(columnFilter.getByRole("combobox")).toHaveValue("");

      const input = await page
        .locator(".vuuColumnFilter")
        .getByRole("combobox");
      await input.focus();
      await input.fill("A");
      await expect(values).toHaveLength(1);
      expect(values.at(-1)).toEqual(["A", BBG, "="]);

      const listbox = page.getByRole("listbox");
      await expect(listbox).toBeVisible();
      await expect(page.getByRole("option", { name: "AAOO L" })).toBeVisible();
      await page.getByRole("option", { name: "AAOO L" }).click();
      await expect(input).toHaveValue("AAOO L");

      await expect(values).toHaveLength(2);
      expect(values.at(-1)).toEqual([BBG, "=", "AAOO L"]);
    });

    test(`Uncontrolled Text ColumnFilter rendered empty, search pattern entered and value selected from search results, correct callbacks are invoked`, async ({
      mount,
      page,
    }) => {
      const values: unknown[] = [];
      const onChange: ColumnFilterChangeHandler = (...args) =>
        values.push(args);
      const onCommit: ColumnFilterCommitHandler = (...args) =>
        values.push(args);

      await mount(
        <LocalDataSourceProvider>
          <UnControlledTextColumnFilter
            onColumnFilterChange={onChange}
            onCommit={onCommit}
          />
        </LocalDataSourceProvider>,
      );

      const columnFilter = page.locator(".vuuColumnFilter");
      expect(columnFilter.getByRole("combobox")).toHaveValue("");

      const input = await page
        .locator(".vuuColumnFilter")
        .getByRole("combobox");
      await input.focus();
      await input.fill("A");
      await expect(values).toHaveLength(1);
      expect(values.at(-1)).toEqual(["A", BBG, "="]);

      const listbox = page.getByRole("listbox");
      await expect(listbox).toBeVisible();
      await expect(page.getByRole("option", { name: "AAOO L" })).toBeVisible();
      await page.getByRole("option", { name: "AAOO L" }).click();
      await expect(input).toHaveValue("AAOO L");

      await expect(values).toHaveLength(2);
      expect(values.at(-1)).toEqual([BBG, "=", "AAOO L"]);
    });

    test(`Using TypeaheadProps, popup suggestions are displayed on click without having to enter text`, async ({
      mount,
      page,
    }) => {
      const TypeaheadProps: ColumnFilterProps["TypeaheadProps"] = {
        minCharacterCountToTriggerSuggestions: 0,
      };
      await mount(
        <LocalDataSourceProvider>
          <ControlledTextColumnFilter TypeaheadProps={TypeaheadProps} />
        </LocalDataSourceProvider>,
      );

      const columnFilter = page.locator(".vuuColumnFilter");
      expect(columnFilter.getByRole("combobox")).toHaveValue("");
      const triggerButton = columnFilter.getByRole("button");
      await expect(triggerButton).toBeVisible();
      await expect(triggerButton).toHaveAttribute("aria-label", "Show options");

      const input = await page
        .locator(".vuuColumnFilter")
        .getByRole("combobox");
      await input.click();

      const listbox = page.getByRole("listbox");
      await expect(listbox).toBeVisible();
      await expect(page.getByRole("option", { name: "AAOO L" })).toBeVisible();
    });

    test(`Controlled Text ColumnFilter rendered empty, search pattern entered and value selected from search results, commits when cleared`, async ({
      mount,
      page,
    }) => {
      const values: unknown[] = [];
      const onChange: ColumnFilterChangeHandler = (...args) =>
        values.push(args);
      const onCommit: ColumnFilterCommitHandler = (...args) =>
        values.push(args);

      await mount(
        <LocalDataSourceProvider>
          <ControlledTextColumnFilter
            onColumnFilterChange={onChange}
            onCommit={onCommit}
          />
        </LocalDataSourceProvider>,
      );

      const columnFilter = page.locator(".vuuColumnFilter");
      expect(columnFilter.getByRole("combobox")).toHaveValue("");

      const input = await page
        .locator(".vuuColumnFilter")
        .getByRole("combobox");
      await input.focus();
      await input.fill("A");

      const listbox = page.getByRole("listbox");
      await expect(listbox).toBeVisible();
      await page.getByRole("option", { name: "AAOO L" }).click();

      values.length = 0;

      // This will invoke change callback 6 times and commit one time
      await input.press("Backspace");
      await input.press("Backspace");
      await input.press("Backspace");
      await input.press("Backspace");
      await input.press("Backspace");
      await input.press("Backspace");

      await expect(values).toHaveLength(7);
      expect(values.at(-1)).toEqual([BBG, "=", ""]);
    });

    test("Controlled Text ColumnFilter rendered with an initial value", async ({
      mount,
      page,
    }) => {
      await mount(
        <LocalDataSourceProvider>
          <ControlledTextColumnFilterPopulated />
        </LocalDataSourceProvider>,
      );

      const columnFilter = page.locator(".vuuColumnFilter");
      expect(columnFilter.getByRole("combobox")).toHaveValue("AAOP.N");
    });

    test("on entering text, matching suggestions are displayed", async ({
      mount,
      page,
    }) => {
      await mount(
        <LocalDataSourceProvider>
          <ControlledTextColumnFilterPopulated />
        </LocalDataSourceProvider>,
      );

      const input = await page
        .locator(".vuuColumnFilter")
        .getByRole("combobox");
      await input.clear();
      await input.fill("A");
      const listbox = page.getByRole("listbox");
      await expect(listbox).toBeVisible();
      await expect(page.getByRole("option", { name: "AAOO.L" })).toBeVisible();
    });

    test("New controlled value is set, will be rendered in control", async ({
      mount,
      page,
    }) => {
      await mount(
        <LocalDataSourceProvider>
          <ControlledTextColumnFilterPopulated />
        </LocalDataSourceProvider>,
      );

      const input = await page
        .locator(".vuuColumnFilter")
        .getByRole("combobox");

      await page.getByRole("button", { name: "AAOQ.OQ" }).click();
      await expect(input).toHaveValue("AAOQ.OQ");
      await page.getByRole("button", { name: "AAOU.MI" }).click();
      await expect(input).toHaveValue("AAOU.MI");
    });
  });

  test.describe("Numeric columnfilter", () => {
    test(`Uncontrolled Numeric ColumnFilter rendered empty, numerics typed, ENTER commits`, async ({
      mount,
      page,
    }) => {
      const values: unknown[] = [];
      const onChange: ColumnFilterChangeHandler = (...args) =>
        values.push(args);
      const onCommit: ColumnFilterCommitHandler = (...args) =>
        values.push(args);

      await mount(
        <LocalDataSourceProvider>
          <UnControlledNumericColumnFilter
            onColumnFilterChange={onChange}
            onCommit={onCommit}
          />
        </LocalDataSourceProvider>,
      );

      const input = await page.locator(".vuuColumnFilter").getByRole("textbox");
      expect(input).toHaveValue("");

      await input.focus();
      await input.press("1");
      expect(values).toHaveLength(1);
      expect(values.pop()).toEqual(["1", PRICE, "="]);

      await input.press("2");
      expect(values.pop()).toEqual(["12", PRICE, "="]);

      await input.press("3");
      await input.press("4");
      await input.press("5");
      await input.press("Enter");

      expect(values.pop()).toEqual([PRICE, "=", "12345"]);
    });

    test(`Uncontrolled Numeric ColumnFilter rendered with value, TAB commits if not already committed `, async ({
      mount,
      page,
    }) => {
      const values: unknown[] = [];
      const onChange: ColumnFilterChangeHandler = (...args) =>
        values.push(args);
      const onCommit: ColumnFilterCommitHandler = (...args) =>
        values.push(args);

      await mount(
        <LocalDataSourceProvider>
          <UnControlledNumericColumnFilter
            defaultValue="999"
            onColumnFilterChange={onChange}
            onCommit={onCommit}
          />
        </LocalDataSourceProvider>,
      );

      const input = await page.locator(".vuuColumnFilter").getByRole("textbox");
      expect(input).toHaveValue("999");

      await input.focus();
      await input.press("9");
      expect(values).toHaveLength(1);
      expect(values.pop()).toEqual(["9999", PRICE, "="]);

      await input.blur();
      expect(values.pop()).toEqual([PRICE, "=", "9999"]);
    });

    test("Controlled Numeric range filter, with initial values", async ({
      mount,
      page,
    }) => {
      await mount(
        <LocalDataSourceProvider>
          <ControlledNumericRangeFilter />
        </LocalDataSourceProvider>,
      );

      const inputs = await page
        .locator(".vuuColumnFilter")
        .getByRole("textbox");
      await expect(inputs).toHaveCount(2);
      await expect(inputs.nth(0)).toHaveValue("35");
      await expect(inputs.nth(1)).toHaveValue("45.3");
    });

    test("THEN component renders a new value provided via state set from outside the container", async ({
      mount,
      page,
    }) => {
      await mount(
        <LocalDataSourceProvider>
          <ControlledNumericRangeFilter />
        </LocalDataSourceProvider>,
      );

      const inputs = await page
        .locator(".vuuColumnFilter")
        .getByRole("textbox");

      await page.getByRole("button", { name: "[10.96, 20.12]" }).click();
      await expect(inputs.nth(0)).toHaveValue("10.96");
      await expect(inputs.nth(1)).toHaveValue("20.12");
      await page.getByRole("button", { name: "[100, 200]" }).click();
      await expect(inputs.nth(0)).toHaveValue("100");
      await expect(inputs.nth(1)).toHaveValue("200");
    });
  });
  test.describe("Time range filter", () => {
    test.skip("should trigger handleColumnFilterChange with correct parameters when time range input changes", async ({
      browserName,
      mount,
      page,
    }) => {
      // the TimeInout selection seems flaky in FF and Safari
      test.skip(browserName === "webkit" || browserName === "firefox");

      const callbacks: unknown[] = [];
      const handler = (...args: unknown[]) => callbacks.push(args);
      await mount(
        <LocalDataSourceProvider>
          <ControlledTimeRangeFilter
            onColumnFilterChange={handler}
            onColumnRangeFilterChange={handler}
            onCommit={handler}
            value={["00:00:00", "23:59:59"]}
          />
        </LocalDataSourceProvider>,
      );

      const inputs = await page
        .locator(".vuuColumnFilter")
        .getByRole("textbox");

      const input1 = inputs.nth(0);
      const input2 = inputs.nth(1);

      await expect(input1).toHaveValue("00:00:00");
      await expect(input2).toHaveValue("23:59:59");

      // Make sure we click on the HOURS value
      var box = (await inputs.nth(0).boundingBox())!;
      await page.mouse.click(box.x + 10, box.y + 10);

      await page.keyboard.down("1");
      await page.keyboard.down("2");

      expect(callbacks).toHaveLength(2);
      expect(callbacks).toEqual([
        ["10:00:00", VUU_CREATED, "between"],
        ["12:00:00", VUU_CREATED, "between"],
      ]);

      callbacks.length = 0;

      await input1.press("Tab");
      await expect(input2).toBeFocused();

      // blur first control of range does not commit
      expect(callbacks).toHaveLength(0);

      // await expect(async () => {
      callbacks.length = 0;

      await expect(input2).toHaveSelection(0, 2);

      await page.keyboard.down("1");
      await expect(input2).toHaveValue("13:59:59");
      await expect(input2).toHaveSelection(1, 2);

      await page.keyboard.down("3");
      await expect(input2).toHaveValue("13:59:59");
      await expect(input2).toHaveSelection(3, 5);

      await page.keyboard.down("0");
      await expect(input2).toHaveValue("13:09:59");
      await expect(input2).toHaveSelection(4, 5);

      await page.keyboard.down("0");
      await expect(input2).toHaveValue("13:00:59");
      await expect(input2).toHaveSelection(6, 8);

      await page.keyboard.down("0");
      await expect(input2).toHaveValue("13:00:09");
      await expect(input2).toHaveSelection(7, 8);

      await input2.press("0");
      await expect(input2).toHaveValue("13:00:00");

      // expect(callbacks).toHaveLength(6);
      expect(callbacks).toEqual([
        ["13:59:59", VUU_CREATED, "between"],
        ["13:59:59", VUU_CREATED, "between"],
        ["13:09:59", VUU_CREATED, "between"],
        ["13:00:59", VUU_CREATED, "between"],
        ["13:00:09", VUU_CREATED, "between"],
        ["13:00:00", VUU_CREATED, "between"],
      ]);
      // }).toPass({
      //   intervals: [1_000, 2_000, 3_000, 4_000],
      //   timeout: 5_000,
      // });
    });
  });
});

test.describe("ColumnFilter with FilterContainer", () => {
  test("Text filter, select value from list commits filter", async ({
    mount,
    page,
  }) => {
    const values: unknown[] = [];
    const onFilterApplied: FilterAppliedHandler<FilterContainerFilter> = (
      ...args
    ) => values.push(args);
    const onFilterCleared = () => values.push("filter cleared");

    await mount(
      <LocalDataSourceProvider>
        <ContainerManagedTextColumnFilter
          onFilterApplied={onFilterApplied}
          onFilterCleared={onFilterCleared}
        />
      </LocalDataSourceProvider>,
    );

    const input = await page.locator(".vuuColumnFilter").getByRole("combobox");
    await input.focus();
    await input.fill("A");

    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible();
    await page.getByRole("option", { name: "AAOO L" }).click();

    expect(values).toHaveLength(1);
    expect(values.pop()).toEqual([
      {
        column: "bbg",
        op: "=",
        value: "AAOO L",
      },
    ]);
  });

  test("Text filter, clearing selected value clears filter", async ({
    mount,
    page,
  }) => {
    const values: unknown[] = [];
    const onFilterApplied: FilterAppliedHandler<FilterContainerFilter> = (
      ...args
    ) => values.push(args);
    const onFilterCleared = () => values.push("filter cleared");

    await mount(
      <LocalDataSourceProvider>
        <ContainerManagedTextColumnFilter
          onFilterApplied={onFilterApplied}
          onFilterCleared={onFilterCleared}
        />
      </LocalDataSourceProvider>,
    );

    const input = await page.locator(".vuuColumnFilter").getByRole("combobox");
    await input.focus();
    await input.fill("A");

    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible();
    await page.getByRole("option", { name: "AAOO L" }).click();

    // This will invoke change callback 6 times and commit one time
    await input.press("Backspace");
    await input.press("Backspace");
    await input.press("Backspace");
    await input.press("Backspace");
    await input.press("Backspace");
    await input.press("Backspace");

    expect(values).toHaveLength(2);

    expect(values.pop()).toEqual("filter cleared");
  });

  test("Numeric filter, no default value, filter with appropriate type created", async ({
    mount,
    page,
  }) => {
    const values: unknown[] = [];
    const onFilterApplied: FilterAppliedHandler<FilterContainerFilter> = (
      ...args
    ) => values.push(args);
    const onFilterCleared = () => values.push("filter cleared");

    await mount(
      <LocalDataSourceProvider>
        <ContainerManagedNumericColumnFilter
          onFilterApplied={onFilterApplied}
          onFilterCleared={onFilterCleared}
        />
      </LocalDataSourceProvider>,
    );

    const input = await page.locator(".vuuColumnFilter").getByRole("textbox");
    await expect(input).toHaveValue("");
    await input.focus();
    await input.press("1");
    await input.press("2");
    await input.press("3");
    await input.press("Enter");

    expect(values).toHaveLength(1);
    expect(values.pop()).toEqual([
      {
        column: "lotSize",
        op: "=",
        value: 123,
      },
    ]);

    await input.press("Backspace");
    await input.press("Backspace");
    await input.press("Backspace");

    expect(values.pop()).toEqual("filter cleared");
  });

  test("Numeric filter, filter provided via container, filter with appropriate type created", async ({
    mount,
    page,
  }) => {
    const filter: FilterContainerFilter = {
      column: "lotSize",
      op: "=",
      value: 100,
    };

    const values: unknown[] = [];
    const onFilterApplied: FilterAppliedHandler<FilterContainerFilter> = (
      ...args
    ) => values.push(args);
    const onFilterCleared = () => values.push("filter cleared");

    await mount(
      <LocalDataSourceProvider>
        <ContainerManagedNumericColumnFilter
          filter={filter}
          onFilterApplied={onFilterApplied}
          onFilterCleared={onFilterCleared}
        />
      </LocalDataSourceProvider>,
    );

    const input = await page.locator(".vuuColumnFilter").getByRole("textbox");
    await expect(input).toHaveValue("100");
    await input.focus();

    // any edit to an existing filter clause clears this filter clause
    await input.press("1");
    expect(values.pop()).toEqual("filter cleared");

    await input.press("Enter");

    expect(values.pop()).toEqual([
      {
        column: "lotSize",
        op: "=",
        value: 1001,
      },
    ]);

    await input.press("Backspace");
    // filter is cleared as soon as we edit a committed filter
    expect(values.pop()).toEqual("filter cleared");

    // further edits will have no effect ...
    await input.press("Backspace");
    await input.press("Backspace");
    await input.press("Backspace");
    expect(values).toHaveLength(0);
  });
});
