// TODO try and get TS path alias working to avoid relative paths like this
import { test, expect } from "@playwright/experimental-ct-react";
import { Instruments } from "../../../../../showcase/src/examples/Table/Modules/SIMUL.examples";
import { LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";
import { TableProps } from "../../Table";

test.describe("Table column resize", () => {
  const RENDER_BUFFER = 5;
  const tableConfig: Partial<TableProps> = {
    renderBufferSize: RENDER_BUFFER,
    height: 625,
    rowHeight: 20,
    width: 800,
  };
  test.describe("WHEN ISIN column seperator is dragged 50px", () => {
    test("THEN ISIN column is resized to 150px", async ({
      browserName,
      mount,
      page,
    }) => {
      //TODO investigate why test fails on Safari
      test.skip(browserName === "webkit");

      await mount(
        <LocalDataSourceProvider>
          <Instruments {...tableConfig} />
        </LocalDataSourceProvider>,
      );

      const isinColumn = page.getByRole("columnheader", {
        name: "isin column header",
      });
      const isinResizerColumn = page.getByRole("separator").nth(4);

      const box = await isinColumn.boundingBox();
      expect(box?.width).toEqual(100);

      const resizerBox = (await isinResizerColumn.boundingBox())!;

      const posX = resizerBox.x + resizerBox.width / 2;
      const posY = resizerBox.y + resizerBox.height / 2;

      await page.mouse.move(posX, posY);
      await page.mouse.down();
      await page.mouse.move(posX + 50, posY, { steps: 10 });
      await page.mouse.up();

      const resizedBox = await isinColumn.boundingBox();
      expect(resizedBox?.width).toEqual(150);
    });
  });
});
