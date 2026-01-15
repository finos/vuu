import { test } from "@playwright/experimental-ct-react";
import { expect } from "../../../../../playwright/customAssertions";
import {
  EditMultiClauseOrFilter,
  NewFilter,
} from "../../../../../showcase/src/examples/Filters/FilterEditor.examples";
import { FilterBarOneSimpleFilter } from "../../../../../showcase/src/examples/Filters/FilterBar/FilterBar.examples";
import { clickFilterPillTrigger, clickMenuItem } from "./filter-test-utils";
import { LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";
import { FilterEditorProps } from "../../filter-editor";

const assertComboboxReady = async (page: any) => {
  await expect(page.getByRole("combobox")).toBeFocused();
  await expect(page.getByRole("listbox")).toBeVisible();
};

const selectMenuOption = async (page: any, name: "AND" | "OR") => {
  const button = page.getByRole("button", { name: "Save" });
  await expect(button).toBeFocused();
  await button.press("ArrowDown");
  await expect(page.getByRole("menu")).toBeVisible();
  await page.getByRole("menuitem", { name }).press("Enter");
};

const EditMultiClauseOrFilterFixture = (props: Partial<FilterEditorProps>) => (
  <LocalDataSourceProvider>
    <EditMultiClauseOrFilter {...props} />
  </LocalDataSourceProvider>
);

const FilterBarOneSimpleFilterFixture = () => (
  <LocalDataSourceProvider>
    <FilterBarOneSimpleFilter />
  </LocalDataSourceProvider>
);

test.describe("FilterEditor", () => {
  test.describe("WHEN rendered with new FilterClauseModel", () => {
    test("THEN it renders with a single clause, with column field only", async ({
      mount,
      page,
    }) => {
      await mount(
        <LocalDataSourceProvider>
          <NewFilter />
        </LocalDataSourceProvider>,
      );
      await expect(page.getByRole("combobox")).toHaveCount(1);
    });

    test("THEN save button is disabled as Clause is invalid", async ({
      mount,
      page,
    }) => {
      await mount(
        <LocalDataSourceProvider>
          <NewFilter />
        </LocalDataSourceProvider>,
      );
      await expect(page.getByRole("button", { name: "Save" })).toBeDisabled();
    });

    test("THEN it renders with first field focused, ready to select", async ({
      mount,
      page,
    }) => {
      await mount(
        <LocalDataSourceProvider>
          <NewFilter />
        </LocalDataSourceProvider>,
      );
      await expect(page.getByRole("combobox")).toBeFocused();
      await expect(page.getByRole("listbox")).toBeVisible();
    });

    test.describe("WHEN rendered with new FilterClauseModel", () => {
      test.describe("WHEN Enter is pressed on default selection", () => {
        test("THEN first column is selected and operator focused", async ({
          mount,
          page,
        }) => {
          await mount(
            <LocalDataSourceProvider>
              <NewFilter />
            </LocalDataSourceProvider>,
          );
          await assertComboboxReady(page);
          await page.getByRole("combobox").press("Enter");
          await expect(page.getByRole("listbox")).toBeVisible();
          await expect(page.getByRole("combobox")).toHaveCount(2);
          await expect(page.getByRole("combobox").nth(1)).toBeFocused();
        });
      });
      test.describe("WHEN Enter is pressed twice to accept default selections", () => {
        test("THEN filter clause value is focused", async ({ mount, page }) => {
          await mount(
            <LocalDataSourceProvider>
              <NewFilter />
            </LocalDataSourceProvider>,
          );
          await assertComboboxReady(page);
          await page.getByRole("combobox").press("Enter");
          await expect(page.getByRole("listbox")).toBeVisible();
          await page.getByRole("combobox").nth(1).press("Enter");
          await expect(page.getByRole("listbox")).toBeVisible();
          await expect(page.getByRole("combobox")).toHaveCount(3);
          await expect(page.getByRole("combobox").nth(2)).toBeFocused();
        });
      });
      test.describe("WHEN Enter is pressed three times to accept default selections", () => {
        test("THEN filterClause is valid and Save button is enabled", async ({
          mount,
          page,
        }) => {
          await mount(
            <LocalDataSourceProvider>
              <NewFilter />
            </LocalDataSourceProvider>,
          );
          await assertComboboxReady(page);

          await page.getByRole("combobox").press("Enter");
          await expect(page.getByRole("listbox")).toBeVisible();
          await page.getByRole("combobox").nth(1).press("Enter");
          await expect(page.getByRole("listbox")).toBeVisible();
          await page.getByRole("combobox").nth(2).press("Enter");
          await expect(page.getByRole("listbox")).not.toBeAttached();

          await expect(page.getByRole("combobox")).toHaveCount(3);
          await expect(
            page.getByRole("button", { name: "Save" }),
          ).toBeEnabled();
          await expect(
            page.getByRole("button", { name: "Save" }),
          ).toBeFocused();
        });
      });
      test.describe("WHEN Enter is pressed until clause complete, then save pressed", () => {
        test("THEN save button is focused and save callback invoked", async ({
          mount,
          page,
        }) => {
          const callbacks: unknown[] = [];
          const handler = (...args: unknown[]) => callbacks.push(args);
          await mount(
            <LocalDataSourceProvider>
              <NewFilter onSave={handler} />
            </LocalDataSourceProvider>,
          );
          await assertComboboxReady(page);

          await page.getByRole("combobox").press("Enter");
          await expect(page.getByRole("listbox")).toBeVisible();
          await page.getByRole("combobox").nth(1).press("Enter");
          await expect(page.getByRole("listbox")).toBeVisible();
          await page.getByRole("combobox").nth(2).press("Enter");
          await expect(
            page.getByRole("button", { name: "Save" }),
          ).toBeFocused();
          await page.getByRole("button", { name: "Save" }).press("Enter");
          await expect(
            page.getByRole("button", { name: "Save" }),
          ).toBeFocused();
          expect(callbacks).toHaveLength(1);
          expect(callbacks[0]).toEqual([
            {
              column: "bbg",
              op: "=",
              value: "AAOO L",
            },
          ]);
        });
      });
    });
  });

  test.describe("Multi clause filters", () => {
    test.describe("WHEN Enter is pressed until clause complete, then AND pressed", () => {
      test("THEN filter combinator (AND) is rendered", async ({
        mount,
        page,
      }) => {
        await mount(
          <LocalDataSourceProvider>
            <NewFilter />
          </LocalDataSourceProvider>,
        );
        await assertComboboxReady(page);

        // accept all the default values
        await page.getByRole("combobox").press("Enter");
        await expect(page.getByRole("listbox")).toBeVisible();
        await page.getByRole("combobox").nth(1).press("Enter");
        await expect(page.getByRole("listbox")).toBeVisible();
        await page.getByRole("combobox").nth(2).press("Enter");

        await selectMenuOption(page, "AND");
        await expect(page.getByRole("button", { name: "and" })).toBeVisible();
        await expect(page.getByRole("button", { name: "and" })).toHaveCount(1);
      });
      test("THEN second clause is created and column focused", async ({
        mount,
        page,
      }) => {
        await mount(
          <LocalDataSourceProvider>
            <NewFilter />
          </LocalDataSourceProvider>,
        );
        await assertComboboxReady(page);

        // accept all the default values
        await page.getByRole("combobox").press("Enter");
        await expect(page.getByRole("listbox")).toBeVisible();
        await page.getByRole("combobox").nth(1).press("Enter");
        await expect(page.getByRole("listbox")).toBeVisible();
        await page.getByRole("combobox").nth(2).press("Enter");

        await selectMenuOption(page, "AND");

        await expect(page.getByRole("combobox")).toHaveCount(4);
        await expect(page.getByRole("listbox")).toBeVisible();
        await expect(page.getByRole("combobox").nth(3)).toBeFocused();
        await expect(
          page.getByRole("button", { name: "Save" }),
        ).not.toBeEnabled();
      });
    });

    test.describe("WHEN second clause is completed and SAVE pressed", () => {
      test("THEN two clause filter is saved", async ({ mount, page }) => {
        const callbacks: unknown[] = [];
        const handler = (...args: unknown[]) => callbacks.push(args);
        await mount(
          <LocalDataSourceProvider>
            <NewFilter onSave={handler} />
          </LocalDataSourceProvider>,
        );
        await assertComboboxReady(page);

        // accept all the default values
        await page.getByRole("combobox").press("Enter");
        await expect(page.getByRole("listbox")).toBeVisible();
        await page.getByRole("combobox").nth(1).press("Enter");
        await expect(page.getByRole("listbox")).toBeVisible();
        await page.getByRole("combobox").nth(2).press("Enter");

        await selectMenuOption(page, "AND");

        const bbg = page.getByRole("option", { name: "bbg" });
        const ccy = page.getByRole("option", { name: "currency" });
        const combobox = page.getByRole("combobox").nth(3);
        await expect(bbg).toBeVisible();
        await expect(bbg).toContainClass("saltOption-active");
        await expect(ccy).toBeVisible();
        await combobox.press("ArrowDown");
        await expect(ccy).toContainClass("saltOption-active");
        await combobox.press("Enter");
        await expect(page.getByRole("combobox")).toHaveCount(5);
        await expect(page.getByRole("listbox")).toBeVisible();

        await page.getByRole("combobox").nth(4).press("Enter");
        await expect(page.getByRole("listbox")).toBeVisible();
        await page.getByRole("combobox").nth(5).press("Enter");
        const saveButton = page.getByRole("button", { name: "Save" });
        await expect(saveButton).toBeFocused();
        await expect(saveButton).toBeFocused();
        await saveButton.press("Enter");

        expect(callbacks).toHaveLength(1);
        expect(callbacks[0]).toEqual([
          {
            op: "and",
            filters: [
              { column: "bbg", op: "=", value: "AAOO L" },
              { column: "currency", op: "=", value: "CAD" },
            ],
          },
        ]);
      });
    });
  });

  test.describe("Arrow key navigation", () => {
    test.describe("within a single clause filter", () => {
      test.describe("WHEN clause complete and Save button focused, then Shift+Tab pressed", () => {
        test("THEN focus returns to last clause and last value is selected", async ({
          mount,
          page,
        }) => {
          await mount(
            <LocalDataSourceProvider>
              <NewFilter />
            </LocalDataSourceProvider>,
          );
          await assertComboboxReady(page);

          // accept all the default values
          await page.getByRole("combobox").press("Enter");
          await expect(page.getByRole("listbox")).toBeVisible();
          await page.getByRole("combobox").nth(1).press("Enter");
          await expect(page.getByRole("listbox")).toBeVisible();
          await page.getByRole("combobox").nth(2).press("Enter");

          const saveButton = page.getByRole("button", { name: "Save" });

          await expect(saveButton).toBeFocused();
          await saveButton.press("Shift+Tab");

          const combo = page.getByRole("combobox").nth(2);
          await expect(combo).toBeFocused();
          await expect(page.getByRole("listbox")).toBeVisible();
          // we can't directly test selected text,  but if we use backspace
          // input text is cleared, indicating that text was selected
          await combo.press("Backspace");
          await expect(combo).toHaveAttribute("value", "");
          await expect(combo).toBeFocused();
        });

        test.describe("AND THEN ArrowLeft is pressed", () => {
          test("THEN focus moves from value to operator and text is selected", async ({
            mount,
            page,
          }) => {
            await mount(
              <LocalDataSourceProvider>
                <NewFilter />
              </LocalDataSourceProvider>,
            );
            await assertComboboxReady(page);

            await page.getByRole("combobox").press("Enter");
            await expect(page.getByRole("listbox")).toBeVisible();
            await page.getByRole("combobox").nth(1).press("Enter");
            await expect(page.getByRole("listbox")).toBeVisible();
            await page.getByRole("combobox").nth(2).press("Enter");

            const saveButton = page.getByRole("button", { name: "Save" });

            await expect(saveButton).toBeFocused();
            await saveButton.press("Shift+Tab");

            const combo2 = page.getByRole("combobox").nth(2);
            await expect(combo2).toBeFocused();
            await expect(page.getByRole("listbox")).toBeVisible();
            await combo2.press("ArrowLeft");

            const combo1 = page.getByRole("combobox").nth(1);
            await expect(combo1).toBeFocused();
            await expect(page.getByRole("listbox")).toBeVisible();

            // we can't directly test selected text,  but if we use backspace
            // input text is cleared, indicating that text was selected
            await combo1.press("Backspace");
            await expect(combo1).toHaveAttribute("value", "");
            await expect(combo1).toBeFocused();
          });
        });

        test.describe("AND THEN ArrowLeft is pressed once more", () => {
          test("THEN focus moves from operator to column and text is selected", async ({
            mount,
            page,
          }) => {
            await mount(
              <LocalDataSourceProvider>
                <NewFilter />
              </LocalDataSourceProvider>,
            );
            await assertComboboxReady(page);

            await page.getByRole("combobox").press("Enter");
            await expect(page.getByRole("listbox")).toBeVisible();
            await page.getByRole("combobox").nth(1).press("Enter");
            await expect(page.getByRole("listbox")).toBeVisible();
            await page.getByRole("combobox").nth(2).press("Enter");

            const saveButton = page.getByRole("button", { name: "Save" });

            await expect(saveButton).toBeFocused();
            await saveButton.press("Shift+Tab");

            const combo2 = page.getByRole("combobox").nth(2);
            await expect(combo2).toHaveSelection(0, 6);
            await expect(combo2).toBeFocused();
            await expect(page.getByRole("listbox")).toBeVisible();
            await combo2.press("ArrowLeft");

            const combo1 = page.getByRole("combobox").nth(1);
            await expect(combo1).toHaveSelection(0, 1);
            await expect(combo1).toBeFocused();
            await expect(page.getByRole("listbox")).toBeVisible();

            await combo1.press("ArrowLeft");

            const combo0 = page.getByRole("combobox").nth(0);
            await expect(combo0).toHaveSelection(0, 3);
            await expect(combo0).toBeFocused();
            // for some reason this check is flaky in chromium only
            // await expect(page.getByRole("listbox")).toBeVisible();

            await combo0.press("Backspace");
            await expect(combo0).toBeFocused();
            await expect(combo0).toHaveAttribute("value", "");
          });
        });
      });
    });
    test.describe("within a multi clause filter", () => {
      test.describe("WHEN right arrow is repeatedly pressed", () => {
        test("THEN focus moves from field to field, first selecting then deselecting, then across combinators and clauses", async ({
          mount,
          page,
        }) => {
          await mount(
            <LocalDataSourceProvider>
              <EditMultiClauseOrFilter />
            </LocalDataSourceProvider>,
          );

          await expect(page.getByRole("combobox")).toHaveCount(6);

          const combo0 = page.getByRole("combobox").nth(0);
          await expect(combo0).toBeFocused();
          await expect(combo0).toHaveSelection(0, 8);

          // One keypress selects text, next deselects, leaving cursor at end
          await combo0.press("ArrowRight");
          await expect(combo0).toHaveSelection(8, 8);
          await combo0.press("ArrowRight");

          const combo1 = page.getByRole("combobox").nth(1);
          await expect(combo1).toBeFocused();
          await expect(combo1).toHaveSelection(0, 1);
          await combo1.press("ArrowRight");
          await expect(combo1).toHaveSelection(1, 1);
          await combo1.press("ArrowRight");

          const combo2 = page.getByRole("combobox").nth(2);
          await expect(combo2).toBeFocused();
          await expect(combo2).toHaveSelection(0, 3);
          await combo2.press("ArrowRight");
          await expect(combo2).toHaveSelection(3, 3);
          await combo2.press("ArrowRight");

          const button = page.getByRole("button", { name: "or" });
          await expect(button).toBeFocused();
          await button.press("ArrowRight");

          const combo3 = page.getByRole("combobox").nth(3);
          await expect(combo3).toBeFocused();
          await expect(combo3).toHaveSelection(0, 8);
          await combo3.press("ArrowRight");
          await expect(combo3).toHaveSelection(8, 8);
          await combo3.press("ArrowRight");

          const combo4 = page.getByRole("combobox").nth(4);
          await expect(combo4).toBeFocused();
          await expect(combo4).toHaveSelection(0, 1);
          await combo4.press("ArrowRight");
          await expect(combo4).toHaveSelection(1, 1);
          await combo4.press("ArrowRight");

          const combo5 = page.getByRole("combobox").nth(5);
          await expect(combo5).toBeFocused();
          await expect(combo5).toHaveSelection(0, 13);
          await combo5.press("ArrowRight");
          await expect(combo5).toHaveSelection(13, 13);

          // // once at the end, we don't go any further without Tabbing
          await combo5.press("ArrowRight");
          await expect(combo5).toBeFocused();
          await expect(combo5).toHaveSelection(13, 13);
        });
      });

      test.describe("WHEN left arrow is repeatedly pressed from end of FilterEditor", () => {
        // this test is flaky. Works 100% with manual interaction. Fails at differernt places in different browsers
        test.skip("THEN focus moves from field to field, first selecting then deselecting, then across combinators and clauses", async ({
          browserName,
          mount,
          page,
        }) => {
          await mount(
            <LocalDataSourceProvider>
              <EditMultiClauseOrFilter />
            </LocalDataSourceProvider>,
          );

          await expect(page.getByRole("combobox")).toHaveCount(6);

          const combo = page.getByRole("combobox").nth(0);
          await expect(combo).toBeFocused();
          await expect(combo).toHaveSelection(0, 8);

          const saveButton = page.getByRole("button", { name: "Save" });

          await saveButton.click();
          await expect(saveButton).toBeFocused();
          await saveButton.press("Shift+Tab");

          const combo5 = page.getByRole("combobox").nth(5);
          await expect(combo5).toHaveSelection(0, 13);
          await expect(combo5).toBeFocused();
          await combo5.press("ArrowLeft");

          const combo4 = page.getByRole("combobox").nth(4);
          await expect(combo4).toHaveSelection(0, 1);
          await expect(combo4).toBeFocused();
          await combo4.press("ArrowLeft");

          const combo3 = page.getByRole("combobox").nth(3);
          await expect(combo3).toHaveSelection(0, 8);
          await expect(combo3).toBeFocused();
          await combo3.press("ArrowLeft");

          const button = page.getByRole("button", { name: "or" });
          await expect(button).toBeFocused();
          await button.press("ArrowLeft");

          const combo2 = page.getByRole("combobox").nth(2);
          await expect(combo2).toHaveSelection(0, 3);
          await expect(combo2).toBeFocused();
          await combo2.press("ArrowLeft");

          const combo1 = page.getByRole("combobox").nth(1);
          await expect(combo1).toHaveSelection(0, 1);
          await expect(combo1).toBeFocused();
          await combo1.press("ArrowLeft");

          const combo0 = page.getByRole("combobox").nth(0);
          await expect(combo0).toHaveSelection(0, 8);
          await expect(combo0).toBeFocused();

          // once at the end, we don't go any further without Tabbing
          await combo0.press("ArrowLeft");
          await expect(combo0).toBeFocused();
          await expect(combo0).toHaveSelection(0, 0);
        });
      });
    });
  });
});
