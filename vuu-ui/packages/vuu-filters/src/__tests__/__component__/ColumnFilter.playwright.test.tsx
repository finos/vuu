import { test } from "@playwright/test";
import { expect } from "../../../../../playwright/customAssertions.cjs";
import type { FilterContainerFilter } from "@vuu-ui/vuu-filter-types";
import type { ColumnFilterProps } from "../../column-filter/ColumnFilter";

const BBG = { name: "bbg", serverDataType: "string" };
const PRICE = { name: "price", serverDataType: "double" };
const VUU_CREATED = {
  name: "vuuCreatedTimestamp",
  serverDataType: "long",
  type: "time",
};

test.describe("ColumnFilter", () => {
  test.describe("TextColumnFilter", () => {
    test("Controlled Text ColumnFilter rendered empty, search pattern entered and value selected from search results, correct callbacks are invoked", async ({
      mount,
      page,
    }) => {
      await mount("Filters/ColumnFilter/ControlledTextColumnFilter");
      const records = page.getByTestId("callback-records");

      const columnFilter = page.locator(".vuuColumnFilter");
      expect(columnFilter.getByRole("combobox")).toHaveValue("");

      const input = await page
        .locator(".vuuColumnFilter")
        .getByRole("combobox");
      await input.focus();
      await input.fill("A");
      await expect(records).toHaveValue(JSON.stringify([["A", BBG, "="]]));

      const listbox = page.getByRole("listbox");
      await expect(listbox).toBeVisible();
      await expect(page.getByRole("option", { name: "AAOO L" })).toBeVisible();
      await page.getByRole("option", { name: "AAOO L" }).click();
      await expect(input).toHaveValue("AAOO L");

      await expect(records).toHaveValue(
        JSON.stringify([
          ["A", BBG, "="],
          [BBG, "=", "AAOO L"],
        ]),
      );
    });

    test("Uncontrolled Text ColumnFilter rendered empty, search pattern entered and value selected from search results, correct callbacks are invoked", async ({
      mount,
      page,
    }) => {
      await mount("Filters/ColumnFilter/UnControlledTextColumnFilter");
      const records = page.getByTestId("callback-records");

      const columnFilter = page.locator(".vuuColumnFilter");
      expect(columnFilter.getByRole("combobox")).toHaveValue("");

      const input = await page
        .locator(".vuuColumnFilter")
        .getByRole("combobox");
      await input.focus();
      await input.fill("A");
      await expect(records).toHaveValue(JSON.stringify([["A", BBG, "="]]));

      const listbox = page.getByRole("listbox");
      await expect(listbox).toBeVisible();
      await expect(page.getByRole("option", { name: "AAOO L" })).toBeVisible();
      await page.getByRole("option", { name: "AAOO L" }).click();
      await expect(input).toHaveValue("AAOO L");

      await expect(records).toHaveValue(
        JSON.stringify([
          ["A", BBG, "="],
          [BBG, "=", "AAOO L"],
        ]),
      );
    });

    test("Using TypeaheadProps, popup suggestions are displayed on click without having to enter text", async ({
      mount,
      page,
    }) => {
      const TypeaheadProps: ColumnFilterProps["TypeaheadProps"] = {
        minCharacterCountToTriggerSuggestions: 0,
      };
      await mount("Filters/ColumnFilter/ShowSuggestionsWithNoTextInput", {
        TypeaheadProps,
      });

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

    test("Controlled Text ColumnFilter rendered empty, search pattern entered and value selected from search results, commits when cleared", async ({
      mount,
      page,
    }) => {
      await mount("Filters/ColumnFilter/ControlledTextColumnFilter");
      const records = page.getByTestId("callback-records");

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

      // This will invoke change callback 6 times and commit one time
      await input.press("Backspace");
      await input.press("Backspace");
      await input.press("Backspace");
      await input.press("Backspace");
      await input.press("Backspace");
      await input.press("Backspace");

      await expect
        .poll(async () => JSON.parse(await records.inputValue()).at(-1))
        .toEqual([BBG, "=", ""]);
    });

    test("Controlled Text ColumnFilter rendered with an initial value", async ({
      mount,
      page,
    }) => {
      await mount("Filters/ColumnFilter/ControlledTextColumnFilterPopulated");

      const columnFilter = page.locator(".vuuColumnFilter");
      expect(columnFilter.getByRole("combobox")).toHaveValue("AAOP.N");
    });

    test("on entering text, matching suggestions are displayed", async ({
      mount,
      page,
    }) => {
      await mount("Filters/ColumnFilter/ControlledTextColumnFilterPopulated");

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
      await mount("Filters/ColumnFilter/ControlledTextColumnFilterPopulated");

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
    test("Uncontrolled Numeric ColumnFilter rendered empty, numerics typed, ENTER commits", async ({
      mount,
      page,
    }) => {
      await mount("Filters/ColumnFilter/UnControlledNumericColumnFilter");
      const records = page.getByTestId("callback-records");

      const input = await page.locator(".vuuColumnFilter").getByRole("textbox");
      expect(input).toHaveValue("");

      await input.focus();
      await input.press("1");
      await expect(records).toHaveValue(JSON.stringify([["1", PRICE, "="]]));

      await input.press("2");
      await expect(records).toHaveValue(
        JSON.stringify([
          ["1", PRICE, "="],
          ["12", PRICE, "="],
        ]),
      );

      await input.press("3");
      await input.press("4");
      await input.press("5");
      await input.press("Enter");

      await expect(records).toHaveValue(
        JSON.stringify([
          ["1", PRICE, "="],
          ["12", PRICE, "="],
          ["123", PRICE, "="],
          ["1234", PRICE, "="],
          ["12345", PRICE, "="],
          [PRICE, "=", "12345"],
        ]),
      );
    });

    test("Uncontrolled Numeric ColumnFilter rendered with value, TAB commits if not already committed ", async ({
      mount,
      page,
    }) => {
      await mount("Filters/ColumnFilter/UnControlledNumericColumnFilter", {
        defaultValue: "999",
      });
      const records = page.getByTestId("callback-records");

      const input = await page.locator(".vuuColumnFilter").getByRole("textbox");
      expect(input).toHaveValue("999");

      await input.focus();
      await input.press("9");
      await expect(records).toHaveValue(JSON.stringify([["9999", PRICE, "="]]));

      await input.blur();
      await expect(records).toHaveValue(
        JSON.stringify([
          ["9999", PRICE, "="],
          [PRICE, "=", "9999"],
        ]),
      );
    });

    test("Controlled Numeric range filter, with initial values", async ({
      mount,
      page,
    }) => {
      await mount("Filters/ColumnFilter/ControlledNumericRangeFilter");

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
      await mount("Filters/ColumnFilter/ControlledNumericRangeFilter");

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
    test("should trigger handleColumnFilterChange with correct parameters when time range input changes", async ({
      mount,
      page,
    }) => {
      // the TimeInout selection seems flaky in FF and Safari
      //test.skip(browserName === "webkit" || browserName === "firefox");

      await mount("Filters/ColumnFilter/ControlledTimeRangeFilter");
      const records = page.getByTestId("callback-records");

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

      await expect(records).toHaveValue(
        JSON.stringify([
          ["10:00:00", VUU_CREATED, "between"],
          ["12:00:00", VUU_CREATED, "between"],
        ]),
      );

      await input1.press("Tab");
      await expect(input2).toBeFocused();

      // blur first control of range does not commit
      await expect(records).toHaveValue(
        JSON.stringify([
          ["10:00:00", VUU_CREATED, "between"],
          ["12:00:00", VUU_CREATED, "between"],
        ]),
      );

      // await expect(async () => {
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
      await expect(records).toHaveValue(
        JSON.stringify([
          ["10:00:00", VUU_CREATED, "between"],
          ["12:00:00", VUU_CREATED, "between"],
          ["13:59:59", VUU_CREATED, "between"],
          ["13:59:59", VUU_CREATED, "between"],
          ["13:09:59", VUU_CREATED, "between"],
          ["13:00:59", VUU_CREATED, "between"],
          ["13:00:09", VUU_CREATED, "between"],
          ["13:00:00", VUU_CREATED, "between"],
        ]),
      );
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
    await mount("Filters/ColumnFilter/ContainerManagedTextColumnFilter");
    const records = page.getByTestId("callback-records");

    const input = await page.locator(".vuuColumnFilter").getByRole("combobox");
    await input.focus();
    await input.fill("A");

    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible();
    await page.getByRole("option", { name: "AAOO L" }).click();

    await expect(records).toHaveValue(
      JSON.stringify([
        [
          {
            column: "bbg",
            op: "=",
            value: "AAOO L",
          },
        ],
      ]),
    );
  });

  test("Text filter, clearing selected value clears filter", async ({
    mount,
    page,
  }) => {
    await mount("Filters/ColumnFilter/ContainerManagedTextColumnFilter");
    const records = page.getByTestId("callback-records");

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

    await expect(records).toHaveValue(
      JSON.stringify([
        [{ column: "bbg", op: "=", value: "AAOO L" }],
        ["filter cleared"],
      ]),
    );
  });

  test("Numeric filter, no default value, filter with appropriate type created", async ({
    mount,
    page,
  }) => {
    await mount("Filters/ColumnFilter/ContainerManagedNumericColumnFilter");
    const records = page.getByTestId("callback-records");

    const input = await page.locator(".vuuColumnFilter").getByRole("textbox");
    await expect(input).toHaveValue("");
    await input.focus();
    await input.press("1");
    await input.press("2");
    await input.press("3");
    await input.press("Enter");

    await expect(records).toHaveValue(
      JSON.stringify([
        [
          {
            column: "lotSize",
            op: "=",
            value: 123,
          },
        ],
      ]),
    );

    await input.press("Backspace");
    await input.press("Backspace");
    await input.press("Backspace");

    await expect(records).toHaveValue(
      JSON.stringify([
        [{ column: "lotSize", op: "=", value: 123 }],
        ["filter cleared"],
      ]),
    );
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

    await mount("Filters/ColumnFilter/ContainerManagedNumericColumnFilter", {
      filter,
    });
    const records = page.getByTestId("callback-records");

    const input = await page.locator(".vuuColumnFilter").getByRole("textbox");
    await expect(input).toHaveValue("100");
    await input.focus();

    // any edit to an existing filter clause clears this filter clause
    await input.press("1");
    await expect(records).toHaveValue(JSON.stringify([["filter cleared"]]));

    await input.press("Enter");

    await expect(records).toHaveValue(
      JSON.stringify([
        ["filter cleared"],
        [{ column: "lotSize", op: "=", value: 1001 }],
      ]),
    );

    await input.press("Backspace");
    // filter is cleared as soon as we edit a committed filter
    await expect(records).toHaveValue(
      JSON.stringify([
        ["filter cleared"],
        [{ column: "lotSize", op: "=", value: 1001 }],
        ["filter cleared"],
      ]),
    );

    // further edits will have no effect ...
    await input.press("Backspace");
    await input.press("Backspace");
    await input.press("Backspace");
    await expect(records).toHaveValue(
      JSON.stringify([
        ["filter cleared"],
        [{ column: "lotSize", op: "=", value: 1001 }],
        ["filter cleared"],
      ]),
    );
  });
});
