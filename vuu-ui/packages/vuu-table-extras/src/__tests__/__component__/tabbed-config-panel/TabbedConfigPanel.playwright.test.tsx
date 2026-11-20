import { expect, test } from "../../../../../../playwright/fixtures.cjs";

test.describe("TabbedConfigPanel", () => {
  test("renders the tabs the host composes, the first selected", async ({
    mount,
    page,
  }) => {
    await mount("TableExtras/TabbedConfigPanel/ColumnsAndQuickFilters");

    const tabList = page.getByRole("tablist", {
      name: "Columns and quick filters",
    });
    const columnsTab = tabList.getByRole("tab", { name: "Columns" });
    const quickFiltersTab = tabList.getByRole("tab", { name: "Quick filters" });

    await expect(tabList.getByRole("tab")).toHaveCount(2);
    await expect(columnsTab).toHaveAttribute("aria-selected", "true");
    await expect(page.locator(".vuuColumnPicker")).toBeVisible();

    await quickFiltersTab.click();
    await expect(quickFiltersTab).toHaveAttribute("aria-selected", "true");
    const quickFilters = page.locator(".vuuQuickFilters-columnsPicker");
    await expect(quickFilters).toBeVisible();
    await expect(quickFilters).toContainText("2 fields in view");
    await expect(
      quickFilters.getByRole("button", { name: "Reset to default" }),
    ).toBeVisible();
  });

  test("selects defaultValue, skips falsy children and honours disabled", async ({
    mount,
    page,
  }) => {
    await mount("TableExtras/TabbedConfigPanel/ConditionalAndDisabledTabs");

    const tabs = page.getByRole("tab");
    await expect(tabs).toHaveText(["Display", "General", "Extra", "Advanced"]);
    await expect(page.getByRole("tab", { name: "General" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.getByText("General settings")).toBeVisible();
    await expect(page.getByRole("tab", { name: "Advanced" })).toBeDisabled();

    await page.getByRole("checkbox", { name: "Include the Extra tab" }).click();
    await expect(tabs).toHaveText(["Display", "General", "Advanced"]);
  });

  test("tabs support keyboard navigation", async ({ mount, page }) => {
    await mount("TableExtras/TabbedConfigPanel/ColumnsAndQuickFilters");

    const columnsTab = page.getByRole("tab", { name: "Columns" });
    const quickFiltersTab = page.getByRole("tab", { name: "Quick filters" });
    await columnsTab.focus();
    await columnsTab.press("ArrowRight");
    await expect(quickFiltersTab).toBeFocused();
    await quickFiltersTab.press("Enter");
    await expect(quickFiltersTab).toHaveAttribute("aria-selected", "true");
  });
});
