// TODO try and get TS path alias working to avoid relative paths like this
import { test } from "@playwright/experimental-ct-react";
import { LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";
import { expect } from "../../../../../playwright/customAssertions";
import { TableOM } from "./TableOM";
import { TestTable } from "../../../../../showcase/src/examples/Table/Misc.examples";
import { TwoHundredColumns } from "../../../../../showcase/src/examples/Table/TEST.examples";

test.describe("Table scrolling and keyboard navigation", () => {
  const RENDER_BUFFER = 5;
  const ROW_COUNT = 1000;
  const tableConfig = {
    renderBufferSize: RENDER_BUFFER,
    headerHeight: 25,
    height: 625,
    rowCount: ROW_COUNT,
    rowHeight: 20,
    width: 1000,
  };
  test.describe("Page Keys", () => {
    test.describe("WHEN first cell is focussed and page down pressed", () => {
      test("THEN table scrolls down and next page of rows are rendered, first cell of new page is focussed", async ({
        mount,
        page,
      }) => {
        await mount(
          <LocalDataSourceProvider>
            <TestTable {...tableConfig} />
          </LocalDataSourceProvider>,
        );
        const table = new TableOM(page.getByRole("table"));

        let cell = table.locateCell(2, 1);
        await cell.click();
        await expect(cell).toBeFocused();
        await expect(cell).toHaveAttribute("tabindex", "0");

        await cell.press("PageDown");

        await table.assertRenderedRows({ from: 30, to: 60 }, 5, 1000);

        const scrollTop = await page.evaluate(
          () => document.querySelector(".vuuTable-contentContainer")?.scrollTop,
        );

        const firstCell = table.locateCell(32, 1);
        await expect(firstCell).toHaveAttribute("tabindex", "0");
        await expect(firstCell).toBeFocused();

        await expect(scrollTop).toEqual(600);
        await expect(table.row(32)).toHaveCSS("top", "600px");
      });

      test.describe("AND WHEN page up is then pressed", () => {
        test("THEN table is back to original state, and first cell is once again focussed", async ({
          mount,
          page,
        }) => {
          await mount(
            <LocalDataSourceProvider>
              <TestTable {...tableConfig} />
            </LocalDataSourceProvider>,
          );
          const table = new TableOM(page.getByRole("table"));

          let cell = table.locateCell(2, 1);
          await cell.click();
          await cell.press("PageDown");

          cell = table.locateCell(32, 1);
          await expect(cell).toBeFocused();

          await cell.press("PageUp");

          cell = table.locateCell(2, 1);

          await expect(cell).toHaveAttribute("tabindex", "0");
          await expect(cell).toBeFocused();
          await table.assertRenderedRows({ from: 0, to: 30 }, 5, 1000);
        });
      });
    });

    test.describe("Home / End Keys", () => {
      test.describe("WHEN topmost rows are in viewport, first cell is focussed and Home key pressed ", () => {
        test("THEN nothing changes", async ({ mount, page }) => {
          await mount(
            <LocalDataSourceProvider>
              <TestTable {...tableConfig} />
            </LocalDataSourceProvider>,
          );

          const table = new TableOM(page.getByRole("table"));

          let cell = table.locateCell(2, 1);
          await cell.click();
          await cell.press("Home");

          await expect(cell).toHaveAttribute("tabindex", "0");
          await expect(cell).toBeFocused();
          await table.assertRenderedRows({ from: 0, to: 30 }, 5, 1000);
        });
      });
      test.describe("WHEN topmost rows are in viewport, cell in middle of viewport is focussed and Home key pressed ", () => {
        test("THEN no scrolling, but focus moves to first cell", async ({
          mount,
          page,
        }) => {
          await mount(
            <LocalDataSourceProvider>
              <TestTable {...tableConfig} />
            </LocalDataSourceProvider>,
          );
          const table = new TableOM(page.getByRole("table"));

          let cell = table.locateCell(6, 1);
          await cell.click();
          await cell.press("Home");

          await expect(cell).toHaveAttribute("tabindex", "0");
          await expect(cell).toBeFocused();
          await table.assertRenderedRows({ from: 0, to: 30 }, 5, 1000);
        });
      });
      test.describe("WHEN topmost rows are in viewport, first cell is focussed and End key pressed ", () => {
        test("THEN scrolls to end of data, last cell is focussed (same column)", async ({
          mount,
          page,
        }) => {
          await mount(
            <LocalDataSourceProvider>
              <TestTable {...tableConfig} />
            </LocalDataSourceProvider>,
          );
          const table = new TableOM(page.getByRole("table"));

          let cell = table.locateCell(2, 1);
          await cell.click();
          await expect(cell).toBeFocused();
          await cell.press("End");

          cell = table.locateCell(1001, 1);
          await expect(cell).toHaveAttribute("tabindex", "0");
          await table.assertRenderedRows({ from: 970, to: 1000 }, 5, 1000);
        });
      });
      test.describe("WHEN topmost rows are in viewport, cell mid viewport focussed and End key pressed ", () => {
        test("THEN scrolls to end of data, last cell is focussed (same column)", async ({
          mount,
          page,
        }) => {
          await mount(
            <LocalDataSourceProvider>
              <TestTable {...tableConfig} />
            </LocalDataSourceProvider>,
          );
          const table = new TableOM(page.getByRole("table"));

          let cell = table.locateCell(11, 1);
          await cell.click();
          await expect(cell).toBeFocused();
          await cell.press("End");

          cell = table.locateCell(1001, 1);
          await expect(cell).toHaveAttribute("tabindex", "0");
          await table.assertRenderedRows({ from: 970, to: 1000 }, 5, 1000);
        });
      });
      test.describe("Arrow Up / Down Keys", () => {
        test.describe("WHEN topmost rows are in viewport, first cell is focussed and Down Arrow key pressed ", () => {
          test("THEN no scrolling, focus moved down to next cell", async ({
            mount,
            page,
          }) => {
            await mount(
              <LocalDataSourceProvider>
                <TestTable {...tableConfig} />
              </LocalDataSourceProvider>,
            );

            const table = new TableOM(page.getByRole("table"));

            let cell = table.locateCell(2, 1);
            await cell.click();
            await expect(cell).toBeFocused();
            await cell.press("ArrowDown");

            cell = table.locateCell(3, 1);
            await expect(cell).toHaveAttribute("tabindex", "0");
            await expect(cell).toBeFocused();
            await table.assertRenderedRows({ from: 0, to: 30 }, 5, 1000);
          });
        });
      });
      test.describe("WHEN topmost rows are in viewport, first cell in last row is focussed and Down Arrow key pressed ", () => {
        test("THEN scroll down by 1 row, cell in bottom row has focus", async ({
          mount,
          page,
        }) => {
          await mount(
            <LocalDataSourceProvider>
              <TestTable {...tableConfig} />
            </LocalDataSourceProvider>,
          );
          const table = new TableOM(page.getByRole("table"));

          let cell = table.locateCell(31, 1);
          await cell.click();
          await expect(cell).toBeFocused();
          await cell.press("ArrowDown");

          cell = table.locateCell(32, 1);
          await expect(cell).toBeFocused();
          await table.assertRenderedRows({ from: 1, to: 31 }, 5, 1000);
        });
      });
      test.describe("scrolling with Mouse Wheel", () => {
        test.describe("WHEN scrolled down by a distance equating to 500 rows", () => {
          test("THEN correct rows are within viewport", async ({
            browserName,
            mount,
            page,
          }) => {
            // The scroll wheel doesn't seem to work in firefox
            test.skip(browserName === "firefox");

            await mount(
              <LocalDataSourceProvider>
                <TestTable {...tableConfig} />
              </LocalDataSourceProvider>,
            );
            const table = new TableOM(page.getByRole("table"));

            let cell = table.locateCell(31, 1);
            await cell.click();

            await page.mouse.wheel(0, 10000);

            await table.assertRenderedRows({ from: 500, to: 530 }, 5, 1000);
          });
        });
      });
      test.describe("horizontal virtualization", () => {
        test.describe("WHEN table has many columns", () => {
          test("THEN only those columns within the viewport are rendered", async ({
            mount,
            page,
          }) => {
            // this width allows for exactly 6 visible columns, we allow a buffer of 200px
            // so 2 out-of-viewport colums are rendered
            await mount(
              <LocalDataSourceProvider>
                <TwoHundredColumns width={914} />
              </LocalDataSourceProvider>,
            );
            const table = new TableOM(page.getByRole("table"));
            let cell = table.locateCell(2, 1);
            await expect(cell).toBeVisible();
            await table.assertRenderedColumns({
              rendered: { from: 1, to: 8 },
              visible: { from: 1, to: 6 },
            });
          });
        });
        test.describe("WHEN table is scrolled horizontally no more than 100px", () => {
          test("THEN rendering is unchanged", async ({ mount, page }) => {
            await mount(
              <LocalDataSourceProvider>
                <TwoHundredColumns width={914} />
              </LocalDataSourceProvider>,
            );

            const table = new TableOM(page.getByRole("table"));

            let cell = table.locateCell(2, 1);
            await cell.click();
            await page.mouse.wheel(100, 0);

            await table.assertRenderedColumns({
              rendered: { from: 1, to: 8 },
              visible: { from: 1, to: 7 },
            });
          });
        });
        test.describe("WHEN table is scrolled beyond the 100px buffer", () => {
          test("THEN additional column(s) are rendered", async ({
            mount,
            page,
          }) => {
            await mount(
              <LocalDataSourceProvider>
                <TwoHundredColumns width={915} />
              </LocalDataSourceProvider>,
            );

            const table = new TableOM(page.getByRole("table"));
            let cell = table.locateCell(2, 1);
            await cell.click();
            await page.mouse.wheel(110, 0);

            await table.assertRenderedColumns({
              rendered: { from: 1, to: 9 },
              visible: { from: 1, to: 7 },
            });
          });
        });
        test.describe("WHEN table is scrolled exactly one viewport width", () => {
          test("THEN next set of columns are rendered", async ({
            browserName,
            mount,
            page,
          }) => {
            // The scroll wheel doesn't seem to work in firefox
            test.skip(browserName === "firefox");

            await mount(
              <LocalDataSourceProvider>
                <TwoHundredColumns width={915} />
              </LocalDataSourceProvider>,
            );
            const table = new TableOM(page.getByRole("table"));
            let cell = table.locateCell(2, 1);
            await cell.click();
            await page.mouse.wheel(900, 0);

            await table.assertRenderedColumns({
              rendered: { from: 6, to: 14 },
              visible: { from: 7, to: 12 },
            });
          });
        });
      });
    });
  });
});
