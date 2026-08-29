import { expect, test } from "@playwright/test";

test.describe("Table drag drop", () => {
  test.describe("Drag drop column headers", () => {
    test.describe("WHEN exchange columns is dragged and dropped on currency", () => {
      test("THEN columns are reordered and grid rerendered", async ({
        browserName,
        mount,
        page,
      }) => {
        //TODO investigate why test fails on Safari
        test.skip(browserName === "webkit");

        await mount("Table/Modules/SIMUL/Instruments");

        const currencyColumn = page.getByRole("columnheader", {
          name: "currency column header",
        });
        const descriptionColumn = page.getByRole("columnheader", {
          name: "description column header",
        });
        const exchangeColumn = page.getByRole("columnheader", {
          name: "exchange column header",
        });

        expect(currencyColumn).toHaveAttribute("aria-colindex", "2");
        expect(descriptionColumn).toHaveAttribute("aria-colindex", "3");
        expect(exchangeColumn).toHaveAttribute("aria-colindex", "4");

        const sourceBox = await exchangeColumn.boundingBox();
        const targetBox = await currencyColumn.boundingBox();
        if (!sourceBox || !targetBox) {
          throw new Error("Unable to resolve drag-and-drop column bounds");
        }

        await page.mouse.move(
          sourceBox.x + sourceBox.width / 2,
          sourceBox.y + sourceBox.height / 2,
        );

        await page.mouse.down();

        await page.mouse.move(
          targetBox.x + sourceBox.width / 2,
          targetBox.y + sourceBox.height / 2,
          { steps: 10 },
        );

        await page.mouse.up();

        await expect(currencyColumn).toHaveAttribute("aria-colindex", "3");
        await expect(descriptionColumn).toHaveAttribute("aria-colindex", "4");
        // Due to quirk of dnd-kit, there may be an extra instance that hangs around (longer than we want the test to wait)
        await expect(exchangeColumn.first()).toHaveAttribute(
          "aria-colindex",
          "2",
        );
      });
    });
  });
});
