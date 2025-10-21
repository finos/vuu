import { test, expect } from "@playwright/experimental-ct-react";
import {
  DefaultTabstrip,
  TabstripEditableLabels,
  TabstripRemoveTab,
} from "../../../../../../showcase/src/examples/UiControls/Tabstrip.examples";

const OVERFLOW_ITEMS = ".vuuOverflowContainer-wrapContainer > *";
const OVERFLOWED_ITEMS = ".vuuOverflowContainer-wrapContainer > .wrapped";
const OVERFLOW_IND =
  ".vuuOverflowContainer-wrapContainer > .vuuOverflowContainer-OverflowIndicator";

test.describe("WHEN initial size is sufficient to display all contents", () => {
  test.describe("WHEN it initially renders", () => {
    test("THEN all the content items will be visible", async ({ mount }) => {
      const component = await mount(<DefaultTabstrip width={500} />);
      const tabstrip = component.getByRole("tablist");
      await expect(tabstrip).toContainClass("vuuTabstrip");
      // The overflow Indicator will be present, but have zero width
      const overflowItems = component.locator(OVERFLOW_ITEMS);
      await expect(overflowItems).toHaveCount(6);
      await expect(overflowItems.filter({ visible: true })).toHaveCount(5);
    });
    test("THEN no items will be overflowed", async ({ mount }) => {
      const component = await mount(<DefaultTabstrip width={500} />);
      const overflowedItems = component.locator(OVERFLOWED_ITEMS);
      await expect(overflowedItems).toHaveCount(0);
    });
    test("THEN no overflow indicator will be visible", async ({ mount }) => {
      const component = await mount(<DefaultTabstrip width={500} />);
      const overflowInd = component.locator(OVERFLOW_IND);
      expect(overflowInd).toHaveCount(1);
      expect(overflowInd).not.toBeVisible();
    });

    test.describe("WHEN resized such that space is sufficient for only 4 tabs (first tab selected)", () => {
      test("THEN first 4 tabs will be displayed, with overflow indicator", async ({
        browserName,
        mount,
      }) => {
        test.skip(
          browserName === "firefox" || browserName === "webkit",
          "failing on COI only",
        );

        const component = await mount(<DefaultTabstrip width={350} />);
        const tablist = await component.getByRole("tablist");
        const box = await tablist.boundingBox();
        expect(box?.width).toEqual(350);

        const overflowItems = component.locator(OVERFLOW_ITEMS);
        await expect(overflowItems).toHaveCount(6);
        await expect(overflowItems.filter({ visible: true })).toHaveCount(5);

        const overflowedItems = component.locator(OVERFLOWED_ITEMS);
        await expect(overflowedItems).toHaveCount(1);

        const wrappedItems = component.locator(".wrapped");
        await expect(wrappedItems).toHaveCount(1);

        const overflowInd = component.locator(OVERFLOW_IND);
        expect(overflowInd).toHaveCount(1);
        expect(overflowInd).toBeVisible();
      });
    });
  });
});

test.describe("Editable tabs", () => {
  test.describe("WHEN enableRenameTab is set", () => {
    test("THEN all tabs are editable", async ({ mount }) => {
      const component = await mount(<TabstripEditableLabels />);
      await expect(component.locator(".vuuEditableLabel")).toHaveCount(5);
    });
  });

  test.describe("WHEN ENTER is pressed on tab selected via keyboard", () => {
    test("THEN tab enters edit state", async ({ mount }) => {
      const component = await mount(<TabstripEditableLabels />);
      const homeTab = component.getByRole("tab", { name: "Home" });
      await homeTab.click();
      await homeTab.press("ArrowRight");

      const transactionsTab = component.getByRole("tab", {
        name: "Transactions",
      });
      await expect(transactionsTab).toBeFocused();
      // First press of ENTER selects ...
      await transactionsTab.press("Enter");
      // // Second press enters edit mode ...
      await transactionsTab.press("Enter");
      await expect(transactionsTab).toContainClass("vuuTab-editing");
      await expect(transactionsTab.getByRole("textbox")).toBeFocused();
    });
  });

  test.describe("WHEN ENTER is pressed on tab selected via click", () => {
    test("THEN tab label enters edit state", async ({ mount }) => {
      const component = await mount(<TabstripEditableLabels />);
      const homeTab = component.getByRole("tab", { name: "Home" });
      await homeTab.click();
      await homeTab.press("Enter");
      await expect(homeTab).toContainClass("vuuTab-editing");
      await expect(homeTab.getByRole("textbox")).toBeFocused();
    });
  });
});
