import { Locator } from "@playwright/experimental-ct-core";
import { test, expect } from "@playwright/experimental-ct-react";
import { CheckboxSelection } from "../../../../../showcase/src/examples/Table/TableSelection.examples";
import { TestTable } from "../../../../../showcase/src/examples/Table/Misc.examples";
import {
  ViewportRowLimitDefaultRowHeight,
  ViewportRowLimitExplicitRowHeight,
  MaxViewportRowLimitRowsExceedLimit,
  MaxViewportRowLimitFewRows,
} from "../../../../../showcase/src/examples/Table/TableLayout.examples";
import { LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";

const getDimensions = async (locator: Locator): Promise<[number, number]> => {
  const box = await locator.boundingBox();
  if (box) {
    const { height, width } = box;
    return [Math.round(width), Math.round(height)];
  } else {
    throw Error(`unable to resolve locator`);
  }
};

test.describe("explicit sizing", () => {
  test("no scrollbars required, columns default (static) sizing, width greater than combined column width", async ({
    mount,
    page,
  }) => {
    await mount(<TestTable height={625} rowCount={20} width={1000} />);

    const vuuTable = page.getByTestId("test-table");
    await expect(await getDimensions(vuuTable)).toEqual([1000, 625]);

    const scrollbarContainer = page.locator(".vuuTable-scrollbarContainer");
    expect(await getDimensions(scrollbarContainer)).toEqual([1000, 600]);

    const contentContainer = page.locator(".vuuTable-contentContainer");
    expect(await getDimensions(contentContainer)).toEqual([1000, 625]);

    const table = page.getByRole("table");
    // 20 rows @ 20 plus header height 25
    // bookends plus combined column widths = 908
    expect(await getDimensions(table)).toEqual([908, 425]);
  });

  test("no scrollbars required, columns fit sizing, width greater than combined default column width", async ({
    mount,
    page,
  }) => {
    await mount(
      <TestTable columnLayout="fit" height={625} rowCount={20} width={1000} />,
    );

    const vuuTable = page.getByTestId("test-table");
    await expect(await getDimensions(vuuTable)).toEqual([1000, 625]);

    const scrollbarContainer = page.locator(".vuuTable-scrollbarContainer");
    expect(await getDimensions(scrollbarContainer)).toEqual([1000, 600]);

    const contentContainer = page.locator(".vuuTable-contentContainer");
    expect(await getDimensions(contentContainer)).toEqual([1000, 625]);

    const table = page.getByRole("table");
    // 20 rows @ 20 plus header height 25
    // bookends plus combined column widths = 908
    expect(await getDimensions(table)).toEqual([1000, 425]);
  });

  test("vertical scrollbar required, columns default (static) sizing, width greater than combined column width", async ({
    mount,
    page,
  }) => {
    await mount(<TestTable height={625} rowCount={100} width={1000} />);

    const vuuTable = page.getByTestId("test-table");
    await expect(await getDimensions(vuuTable)).toEqual([1000, 625]);

    const scrollbarContainer = page.locator(".vuuTable-scrollbarContainer");
    expect(await getDimensions(scrollbarContainer)).toEqual([1000, 600]);

    const contentContainer = page.locator(".vuuTable-contentContainer");
    expect(await getDimensions(contentContainer)).toEqual([990, 625]);

    const table = page.getByRole("table");
    // 100 rows @ 20 plus header height 25
    expect(await getDimensions(table)).toEqual([908, 2025]);
  });

  test("vertical scrollbar required, columns fit sizing, width greater than combined column width", async ({
    mount,
    page,
  }) => {
    await mount(
      <TestTable columnLayout="fit" height={625} rowCount={100} width={1000} />,
    );

    const vuuTable = page.getByTestId("test-table");
    await expect(await getDimensions(vuuTable)).toEqual([1000, 625]);

    const scrollbarContainer = page.locator(".vuuTable-scrollbarContainer");
    expect(await getDimensions(scrollbarContainer)).toEqual([1000, 600]);

    const contentContainer = page.locator(".vuuTable-contentContainer");
    expect(await getDimensions(contentContainer)).toEqual([990, 625]);

    const table = page.getByRole("table");
    // 100 rows @ 20 plus header height 25
    expect(await getDimensions(table)).toEqual([990, 2025]);
  });

  test("vertical scrollbars required, checkbox selection, columns fit sizing, width greater than combined default column width", async ({
    mount,
    page,
  }) => {
    await mount(
      <LocalDataSourceProvider>
        <CheckboxSelection columnLayout="fit" height={625} width={1000} />
      </LocalDataSourceProvider>,
    );

    const vuuTable = page.getByTestId("table");
    await expect(await getDimensions(vuuTable)).toEqual([1000, 625]);

    const scrollbarContainer = page.locator(".vuuTable-scrollbarContainer");
    expect(await getDimensions(scrollbarContainer)).toEqual([1000, 600]);

    const contentContainer = page.locator(".vuuTable-contentContainer");
    expect(await getDimensions(contentContainer)).toEqual([990, 625]);

    const table = page.getByRole("table");
    expect(await getDimensions(table)).toEqual([987, 200025]);
  });
  test("vertical and horizontal scrollbars required, columns default (static) sizing, width greater than combined column width", async ({
    mount,
    page,
  }) => {
    await mount(<TestTable height={625} rowCount={100} width={800} />);

    const vuuTable = page.getByTestId("test-table");
    await expect(await getDimensions(vuuTable)).toEqual([800, 625]);

    const scrollbarContainer = page.locator(".vuuTable-scrollbarContainer");
    expect(await getDimensions(scrollbarContainer)).toEqual([800, 600]);

    const contentContainer = page.locator(".vuuTable-contentContainer");
    expect(await getDimensions(contentContainer)).toEqual([790, 615]);

    const table = page.getByRole("table");
    expect(await getDimensions(table)).toEqual([908, 2025]);
  });
});

test.describe("viewportRowLimit", () => {
  test.describe("WHEN rendered with default rowHeight", () => {
    test("THEN expected classname is present and all dimensions are correct", async ({
      mount,
      page,
    }) => {
      await mount(<ViewportRowLimitDefaultRowHeight />);

      const vuuTable = page.getByTestId("table");
      await expect(await getDimensions(vuuTable)).toEqual([600, 235]);
      await expect(vuuTable).toContainClass("vuuTable-viewportRowLimit");

      const scrollbarContainer = page.locator(".vuuTable-scrollbarContainer");
      expect(await getDimensions(scrollbarContainer)).toEqual([600, 210]);

      const contentContainer = page.locator(".vuuTable-contentContainer");
      expect(await getDimensions(contentContainer)).toEqual([590, 225]);
    });
  });
  test.describe("WHEN rendered with explicit rowHeight", () => {
    test("THEN expected classname is present", async ({ mount, page }) => {
      await mount(<ViewportRowLimitExplicitRowHeight />);

      const vuuTable = page.getByTestId("table");
      await expect(await getDimensions(vuuTable)).toEqual([600, 335]);
      await expect(vuuTable).toContainClass("vuuTable-viewportRowLimit");

      const scrollbarContainer = page.locator(".vuuTable-scrollbarContainer");
      expect(await getDimensions(scrollbarContainer)).toEqual([600, 310]);

      const contentContainer = page.locator(".vuuTable-contentContainer");
      expect(await getDimensions(contentContainer)).toEqual([590, 325]);
    });
  });
});

test.describe("maxViewportRowLimit", () => {
  test.describe("WHEN rendered with more rows than viewport can accommodate and horizontal scrollbar", () => {
    test("THEN height is based on rows rendered and scrollbar", async ({
      mount,
      page,
    }) => {
      await mount(<MaxViewportRowLimitRowsExceedLimit />);

      const vuuTable = page.getByTestId("table");
      await expect(await getDimensions(vuuTable)).toEqual([600, 235]);

      const scrollbarContainer = page.locator(".vuuTable-scrollbarContainer");
      expect(await getDimensions(scrollbarContainer)).toEqual([600, 210]);

      const contentContainer = page.locator(".vuuTable-contentContainer");
      expect(await getDimensions(contentContainer)).toEqual([590, 225]);

      const table = page.getByRole("table");
      expect(await getDimensions(table)).toEqual([1008, 200025]);
    });
  });

  test.describe("WHEN rendered with not enough rows to fill viewport, no horizontal scrollbar", () => {
    test("THEN height is reduced to just accommodate visible row", async ({
      mount,
      page,
    }) => {
      await mount(<MaxViewportRowLimitFewRows />);
      const vuuTable = page.getByTestId("table");
      await expect(await getDimensions(vuuTable)).toEqual([600, 105]);

      const scrollbarContainer = page.locator(".vuuTable-scrollbarContainer");
      expect(await getDimensions(scrollbarContainer)).toEqual([600, 80]);

      const contentContainer = page.locator(".vuuTable-contentContainer");
      expect(await getDimensions(contentContainer)).toEqual([600, 105]);

      const table = page.getByRole("table");
      // 4 columns x 100px + bookends
      expect(await getDimensions(table)).toEqual([408, 105]);
    });
  });
  test.describe("WHEN rendered with not enough rows to fill viewport, with horizontal scrollbar", () => {
    test("THEN height is reduced to just accommodate visible rows", async ({
      mount,
      page,
    }) => {
      await mount(<MaxViewportRowLimitFewRows width={300} />);
      const vuuTable = page.getByTestId("table");
      await expect(await getDimensions(vuuTable)).toEqual([300, 115]);

      const scrollbarContainer = page.locator(".vuuTable-scrollbarContainer");
      expect(await getDimensions(scrollbarContainer)).toEqual([300, 90]);

      const contentContainer = page.locator(".vuuTable-contentContainer");
      expect(await getDimensions(contentContainer)).toEqual([300, 105]);

      const table = page.getByRole("table");
      expect(await getDimensions(table)).toEqual([408, 105]);
    });
  });
});
