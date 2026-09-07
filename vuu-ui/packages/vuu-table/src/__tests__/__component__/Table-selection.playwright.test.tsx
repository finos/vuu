import { expect, test } from "../../../../../playwright/fixtures";

test.describe("default (extended) selection", () => {
  test("default selection includes simple row selection", async ({
    browserName,
    mount,
    page,
  }) => {
    test.skip(browserName === "webkit" || browserName === "firefox");

    const component = await mount("Table/Modules/SIMUL/Instruments");
    const table = page.getByRole("table");
    await expect(table.locator('[aria-selected="true"]')).toHaveCount(0);

    const firstRow = component.getByRole("row").nth(1);
    await expect(firstRow).not.toHaveAttribute("aria-selected", "true");

    await firstRow.click();
    await expect(firstRow).toHaveAttribute("aria-selected", "true");

    await expect(table.locator('[aria-selected="true"]')).toHaveCount(1);

    const secondRow = component.getByRole("row").nth(2);
    await expect(secondRow).not.toHaveAttribute("aria-selected", "true");

    await secondRow.click();
    await expect(firstRow).not.toHaveAttribute("aria-selected", "true");
    await expect(secondRow).toHaveAttribute("aria-selected", "true");
    await expect(table.locator('[aria-selected="true"]')).toHaveCount(1);

    await secondRow.click();
    await expect(secondRow).not.toHaveAttribute("aria-selected", "true");
    await expect(table.locator('[aria-selected="true"]')).toHaveCount(0);
  });

  test("default selection includes shift click to add range to select", async ({
    browserName,
    mount,
    page,
  }) => {
    test.skip(browserName === "webkit" || browserName === "firefox");

    await mount("Table/Modules/SIMUL/Instruments");
    const table = page.getByRole("table");
    const firstRow = table.getByRole("row").nth(1);
    const secondRow = table.getByRole("row").nth(2);
    const thirdRow = table.getByRole("row").nth(3);
    await firstRow.click();
    await thirdRow.click({ modifiers: ["Shift"] });

    await expect(firstRow).toHaveAttribute("aria-selected", "true");
    await expect(secondRow).toHaveAttribute("aria-selected", "true");
    await expect(thirdRow).toHaveAttribute("aria-selected", "true");

    await expect(table.locator('[aria-selected="true"]')).toHaveCount(3);
  });
});
