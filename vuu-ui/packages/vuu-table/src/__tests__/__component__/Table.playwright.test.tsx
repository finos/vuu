import { test, expect } from "@playwright/test";
import { Instruments } from "../../../../../showcase/src/examples/Table/Modules/SIMUL.examples";
import {
  SwitchableDataSourceTable,
  TestTable,
} from "../../../../../showcase/src/examples/Table/Misc.examples";
import { LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";
import { TableOM } from "./TableOM";

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

test.describe("WHEN it initially renders", () => {
  test("THEN expected className is present", async ({ mount, page }) => {
    await mount(
      <LocalDataSourceProvider>
        <Instruments
          data-testid="table"
          renderBufferSize={5}
          height={625}
          width={800}
        />
      </LocalDataSourceProvider>,
    );
    const vuuTable = page.getByTestId("table");
    await expect(vuuTable).toContainClass("vuuTable");
  });

  test("THEN expected number of rows are present, with buffered rows, all with correct aria index", async ({
    mount,
    page,
  }) => {
    await mount(<TestTable {...tableConfig} />);
    const table = new TableOM(page.getByTestId("test-table"));
    await table.assertRenderedRows(
      { from: 1, to: 30 },
      RENDER_BUFFER,
      ROW_COUNT,
    );
  });
});

test.describe("WHEN its datasource changes", () => {
  test("THEN it switches subscriptions, ignores late messages, and can switch back", async ({
    mount,
    page,
  }) => {
    await mount(<SwitchableDataSourceTable />);
    const table = page.getByTestId("switchable-data-source-table");

    await expect(table).toContainText("source-value");

    await page.getByRole("button", { name: "Switch to session" }).click();
    await expect(table).toContainText("session-value");
    await expect(table).not.toContainText("source-value");

    await page.getByRole("button", { name: "Send late source update" }).click();
    await expect(table).toContainText("session-value");
    await expect(table).not.toContainText("late-source-value");

    await page.getByRole("button", { name: "Switch to source" }).click();
    await expect(table).toContainText("source-value-after-return");
    await expect(table).not.toContainText("session-value");
  });
});
