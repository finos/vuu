import type { Page } from "@playwright/test";
import { expect, test } from "../../../../../playwright/fixtures";
import { PwTable } from "@vuu-ui/vuu-playwright-helpers";

const commitValue = async (page: Page, label: string, value: string) => {
  const input = page.getByRole("textbox", { name: label });
  await input.fill(value);
  await input.press("Enter");
};

const selectOperator = async (page: Page, label: string, op: string) => {
  await page.getByRole("combobox", { name: label }).click();
  await page.getByRole("option", { name: op, exact: true }).click();
};

/** The text of every rendered cell in a Table column */
const columnValues = async (page: Page, columnName: string) => {
  const table = new PwTable(page);
  const colIndex = await table.locator
    .locator(`[data-column-name="${columnName}"]`)
    .first()
    .getAttribute("aria-colindex");
  return table.locator
    .locator(
      `[aria-rowindex]:not([aria-rowindex="1"]) > [aria-colindex="${colIndex}"]`,
    )
    .allTextContents();
};

/** The number of rows in the DataSource, from DataSourceStats */
const rowCount = async (page: Page) => {
  const stats = page.locator(".vuuDatasourceStats-rowStats");
  await expect(stats).toContainText("of");
  const text = (await stats.textContent()) ?? "";
  return parseInt(text.split("of")[1].replace(/[^\d]/g, ""), 10);
};

test.describe("ColumnFilter on a scaled decimal column", () => {
  test.describe("scaleddecimal6, displayed with 2 decimals", () => {
    test("a value with 2 decimals matches every value that displays as it", async ({
      mount,
      page,
    }) => {
      await mount(
        "Filters/ColumnFilter/ContainerManagedScaledDecimalColumnFilter",
      );
      await commitValue(page, "FX rate", "1.23");
      await expect(page.getByTestId("callback-records")).toHaveValue(
        JSON.stringify([
          [
            {
              column: "fxRate",
              op: "=",
              value: "1.23",
              extendedOptions: {
                type: "ScaledDecimal",
                scale: 6,
                decimals: 2,
                roundingRule: "round",
              },
            },
          ],
        ]),
      );
      await expect(page.getByTestId("vuu-filter-query")).toHaveText(
        "fxRate >= 1.225000 and fxRate <= 1.234999",
      );
    });

    test("a value with 1 decimal is interpreted at the displayed precision", async ({
      mount,
      page,
    }) => {
      await mount(
        "Filters/ColumnFilter/ContainerManagedScaledDecimalColumnFilter",
      );
      await commitValue(page, "FX rate", "1.2");
      await expect(page.getByTestId("vuu-filter-query")).toHaveText(
        "fxRate >= 1.195000 and fxRate <= 1.204999",
      );
    });

    test("a value with more decimals than displayed is matched at its own precision", async ({
      mount,
      page,
    }) => {
      await mount(
        "Filters/ColumnFilter/ContainerManagedScaledDecimalColumnFilter",
      );
      await commitValue(page, "FX rate", "1.2345");
      await expect(page.getByTestId("vuu-filter-query")).toHaveText(
        "fxRate >= 1.234450 and fxRate <= 1.234549",
      );
    });

    test("a value with as many decimals as the scale is matched exactly", async ({
      mount,
      page,
    }) => {
      await mount(
        "Filters/ColumnFilter/ContainerManagedScaledDecimalColumnFilter",
      );
      await commitValue(page, "FX rate", "1.234567");
      await expect(page.getByTestId("vuu-filter-query")).toHaveText(
        "fxRate = 1.234567",
      );
    });

    test("a negative value matches values that round to it", async ({
      mount,
      page,
    }) => {
      await mount(
        "Filters/ColumnFilter/ContainerManagedScaledDecimalColumnFilter",
      );
      await commitValue(page, "FX rate", "-0.5");
      await expect(page.getByTestId("vuu-filter-query")).toHaveText(
        "fxRate >= -0.504999 and fxRate <= -0.495000",
      );
    });

    test("a persisted filter restores the value as entered", async ({
      mount,
      page,
    }) => {
      await mount(
        "Filters/ColumnFilter/ContainerManagedScaledDecimalColumnFilterWithFilter",
      );
      await expect(
        page.locator(".vuuColumnFilter").getByRole("textbox"),
      ).toHaveValue("1.23");
      await expect(page.getByTestId("vuu-filter-query")).toHaveText(
        "fxRate >= 1.225000 and fxRate <= 1.234999",
      );
    });

    test("a value that is not a decimal creates no filter", async ({
      mount,
      page,
    }) => {
      await mount(
        "Filters/ColumnFilter/ContainerManagedScaledDecimalColumnFilter",
      );
      await commitValue(page, "FX rate", "abc");
      await expect(page.getByTestId("vuu-filter-query")).toHaveText("");
    });
  });

  test("scaleddecimal2, displaying every decimal, matches exactly", async ({
    mount,
    page,
  }) => {
    await mount(
      "Filters/ColumnFilter/ContainerManagedScaledDecimal2ColumnFilter",
    );
    await commitValue(page, "Notional", "1.23");
    await expect(page.getByTestId("vuu-filter-query")).toHaveText(
      "notional = 1.23",
    );
  });

  test("scaleddecimal4, displayed with 2 decimals", async ({ mount, page }) => {
    await mount(
      "Filters/ColumnFilter/ContainerManagedScaledDecimal4ColumnFilter",
    );
    await commitValue(page, "Close price", "100");
    await expect(page.getByTestId("vuu-filter-query")).toHaveText(
      "closePrice >= 99.9950 and closePrice <= 100.0049",
    );
  });

  test("scaleddecimal8, displayed with 4 decimals", async ({ mount, page }) => {
    await mount(
      "Filters/ColumnFilter/ContainerManagedScaledDecimal8ColumnFilter",
    );
    await commitValue(page, "Weight", "0.03");
    await expect(page.getByTestId("vuu-filter-query")).toHaveText(
      "weight >= 0.02995000 and weight <= 0.03004999",
    );
  });
});

test.describe("ColumnFilter on a char column", () => {
  test("a toggle filter creates a clause on the char value", async ({
    mount,
    page,
  }) => {
    await mount("Filters/ColumnFilter/ContainerManagedCharToggleFilter");
    await page.getByRole("radio", { name: "Sell" }).click();
    await expect(page.getByTestId("callback-records")).toHaveValue(
      JSON.stringify([[{ column: "side", op: "=", value: "S" }]]),
    );
  });
});

test.describe("FilterContainer with a filter for every column type", () => {
  test("a scaled decimal filter matches only rows displaying the value", async ({
    mount,
    page,
  }) => {
    await mount(
      "Filters/FilterContainer/AllColumnTypesWithScaledDecimalFilter",
    );
    await expect(page.getByTestId("vuu-filter-query")).toHaveText(
      "fxRate >= 1.225000 and fxRate <= 1.234999",
    );
    await expect.poll(() => rowCount(page)).toBeLessThan(10_000);
    const values = await columnValues(page, "fxRate");
    expect(values.length).toBeGreaterThan(1);
    expect(new Set(values)).toEqual(new Set(["1.23"]));
  });

  test("operators on a displayed value partition the rows", async ({
    mount,
    page,
  }) => {
    await mount("Filters/FilterContainer/AllColumnTypesWithOperators");
    await expect.poll(() => rowCount(page)).toBe(10_000);

    const queries: Record<string, string> = {
      "=": "fxRate >= 1.225000 and fxRate <= 1.234999",
      "!=": "fxRate < 1.225000 or fxRate > 1.234999",
      ">": "fxRate > 1.234999",
      ">=": "fxRate >= 1.225000",
      "<": "fxRate < 1.225000",
    };
    // successive counts always differ, so a changed count is the new result
    let previousCount = 10_000;
    const countFor = async (op: string) => {
      await selectOperator(page, "FX rate (round)", op);
      await commitValue(page, "FX rate (round)", "1.23");
      await expect(page.getByTestId("vuu-filter-query")).toHaveText(
        queries[op],
      );
      await expect.poll(() => rowCount(page)).not.toBe(previousCount);
      previousCount = await rowCount(page);
      return previousCount;
    };

    const eq = await countFor("=");
    expect(new Set(await columnValues(page, "fxRate"))).toEqual(
      new Set(["1.23"]),
    );
    const ne = await countFor("!=");
    expect(await columnValues(page, "fxRate")).not.toContain("1.23");
    const gt = await countFor(">");
    const ge = await countFor(">=");
    const lt = await countFor("<");

    expect(eq).toBeGreaterThan(1);
    expect(eq + ne).toBe(10_000);
    expect(ge - gt).toBe(eq);
    expect(lt + ge).toBe(10_000);
  });

  test("a value more precise than displayed matches the underlying value", async ({
    mount,
    page,
  }) => {
    await mount("Filters/FilterContainer/AllColumnTypes");
    // closePrice 27.0593 displays as 27.06 (rounded), 27.05 (truncated)
    await commitValue(page, "Close price (round)", "27.059");
    await expect(page.getByTestId("vuu-filter-query")).toHaveText(
      "closePrice >= 27.0585 and closePrice <= 27.0594",
    );
    await expect.poll(() => rowCount(page)).toBe(1);
    expect(await columnValues(page, "closePrice")).toEqual(["27.06"]);
    expect(await columnValues(page, "closePriceTruncated")).toEqual(["27.05"]);
    await expect(
      page.locator(".exampleUnderlyingValueCell").first(),
    ).toHaveAttribute("title", "underlying value 27.0593");
  });

  test.describe("a value filtered rounded and truncated", () => {
    test("rounded, matches the rows displaying the value rounded", async ({
      mount,
      page,
    }) => {
      await mount("Filters/FilterContainer/AllColumnTypes");
      await commitValue(page, "Close price (round)", "27.06");
      await expect(page.getByTestId("vuu-filter-query")).toHaveText(
        "closePrice >= 27.0550 and closePrice <= 27.0649",
      );
      await expect.poll(() => rowCount(page)).toBeLessThan(10_000);
      expect(new Set(await columnValues(page, "closePrice"))).toEqual(
        new Set(["27.06"]),
      );
    });

    test("truncated, matches the rows displaying the value truncated", async ({
      mount,
      page,
    }) => {
      await mount("Filters/FilterContainer/AllColumnTypes");
      await commitValue(page, "Close price (truncate)", "27.05");
      await expect(page.getByTestId("vuu-filter-query")).toHaveText(
        "closePriceTruncated >= 27.0500 and closePriceTruncated <= 27.0599",
      );
      await expect.poll(() => rowCount(page)).toBeLessThan(10_000);
      expect(new Set(await columnValues(page, "closePriceTruncated"))).toEqual(
        new Set(["27.05"]),
      );
      // the row holding 27.0593 displays 27.05 truncated, 27.06 rounded
      await expect(
        page.locator(
          '.exampleUnderlyingValueCell[title="underlying value 27.0593"]',
        ),
      ).toHaveCount(2);
    });

    test("operators on a truncated value partition the rows", async ({
      mount,
      page,
    }) => {
      await mount("Filters/FilterContainer/AllColumnTypesWithOperators");
      await expect.poll(() => rowCount(page)).toBe(10_000);
      const label = "FX rate (truncate)";
      const counts: Record<string, number> = {};
      let previousCount = 10_000;
      for (const [op, query] of [
        ["=", "fxRateTruncated >= 1.230000 and fxRateTruncated <= 1.239999"],
        ["!=", "fxRateTruncated < 1.230000 or fxRateTruncated > 1.239999"],
        [">=", "fxRateTruncated >= 1.230000"],
        [">", "fxRateTruncated > 1.239999"],
      ]) {
        await selectOperator(page, label, op);
        await commitValue(page, label, "1.23");
        await expect(page.getByTestId("vuu-filter-query")).toHaveText(query);
        await expect.poll(() => rowCount(page)).not.toBe(previousCount);
        previousCount = counts[op] = await rowCount(page);
        if (op === "=") {
          expect(new Set(await columnValues(page, "fxRateTruncated"))).toEqual(
            new Set(["1.23"]),
          );
        }
      }
      expect(counts["="]).toBeGreaterThan(1);
      expect(counts["="] + counts["!="]).toBe(10_000);
      expect(counts[">="] - counts[">"]).toBe(counts["="]);
    });
  });

  test("a char toggle filters the table", async ({ mount, page }) => {
    await mount("Filters/FilterContainer/AllColumnTypes");
    await page.getByRole("radio", { name: "Buy" }).click();
    await expect(page.getByTestId("vuu-filter-query")).toHaveText('side = "B"');
    await expect.poll(() => rowCount(page)).toBeLessThan(10_000);
    expect(new Set(await columnValues(page, "side"))).toEqual(new Set(["B"]));
  });
});
