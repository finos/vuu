import { expect, test } from "../../../../../playwright/fixtures";

test.describe("Table column resize", () => {
  test.describe("WHEN ISIN column seperator is dragged 50px", () => {
    test("THEN ISIN column is resized to 150px", async ({
      browserName,
      mount,
      page,
    }) => {
      //TODO investigate why test fails on Safari
      test.skip(browserName === "webkit");

      await mount("Table/Modules/SIMUL/Instruments");

      const isinColumn = page.getByRole("columnheader", {
        name: "isin column header",
      });
      const isinResizerColumn = page.getByRole("separator").nth(4);

      const box = await isinColumn.boundingBox();
      expect(box?.width).toEqual(100);

      const resizerBox = await isinResizerColumn.boundingBox();
      if (!resizerBox) {
        throw new Error("Unable to resolve ISIN column resizer bounds");
      }

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
