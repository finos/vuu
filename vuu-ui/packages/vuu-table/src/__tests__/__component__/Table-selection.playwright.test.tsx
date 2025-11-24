import { test, expect } from "@playwright/experimental-ct-react";
import { Instruments } from "../../../../../showcase/src/examples/Table/Modules/SIMUL.examples";
import { LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";

declare module "@playwright/test" {
  namespace PlaywrightTest {
    interface Matchers<R, T = unknown> {
      toBeSelected(this: T): Promise<R>;
    }
  }
}
test.describe("default (extended) selection", () => {
  test("default selection includes simple row selection", async ({
    browserName,
    mount,
    page,
  }) => {
    test.skip(browserName === "webkit" || browserName === "firefox");

    const component = await mount(
      <LocalDataSourceProvider>
        <Instruments />
      </LocalDataSourceProvider>,
    );
    const table = page.getByRole("table");
    expect(table.locator('[aria-selected="true"]')).toHaveCount(0);

    const firstRow = component.getByRole("row").nth(1);
    expect(firstRow).not.toHaveAttribute("aria-selected", "true");

    await firstRow.click();
    expect(firstRow).toHaveAttribute("aria-selected", "true");

    expect(table.locator('[aria-selected="true"]')).toHaveCount(1);

    const secondRow = component.getByRole("row").nth(2);
    expect(secondRow).not.toHaveAttribute("aria-selected", "true");

    await secondRow.click();
    expect(firstRow).not.toHaveAttribute("aria-selected", "true");
    expect(secondRow).toHaveAttribute("aria-selected", "true");
    expect(table.locator('[aria-selected="true"]')).toHaveCount(1);

    await secondRow.click();
    expect(secondRow).not.toHaveAttribute("aria-selected", "true");
    expect(table.locator('[aria-selected="true"]')).toHaveCount(0);
  });

  test("default selection includes shift click to add range to select", async ({
    browserName,
    mount,
    page,
  }) => {
    test.skip(browserName === "webkit" || browserName === "firefox");

    const component = await mount(
      <LocalDataSourceProvider>
        <Instruments />
      </LocalDataSourceProvider>,
    );
    const table = page.getByRole("table");
    const firstRow = table.getByRole("row").nth(1);
    const secondRow = table.getByRole("row").nth(2);
    const thirdRow = table.getByRole("row").nth(3);
    await firstRow.click();
    await thirdRow.click({ modifiers: ["Shift"] });

    expect(firstRow).toHaveAttribute("aria-selected", "true");
    expect(secondRow).toHaveAttribute("aria-selected", "true");
    expect(thirdRow).toHaveAttribute("aria-selected", "true");

    expect(table.locator('[aria-selected="true"]')).toHaveCount(3);
  });
});
