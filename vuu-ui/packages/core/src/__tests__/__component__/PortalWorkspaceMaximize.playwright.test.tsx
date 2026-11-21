import type { Locator, Page } from "@playwright/test";
import { expect, test } from "../../../../../playwright/fixtures";

const maximizable = "VuuPortal/PanelsPalette/WorkspacesWithMaximizablePanels";
const notMaximizable = "VuuPortal/PanelsPalette/WorkspacesWithPanelsPalette";

/** The open workspace's grid. Its id is generated when the workspace opens. */
const workspaceGrid = (page: Page) =>
  page.locator(".vuuPortalWorkspace-grid > .vuuGridLayout");

/** Opens the Markets workspace, which has two panels. */
const openMarkets = async (page: Page) => {
  await page.getByRole("link", { name: "Markets" }).click();
  const grid = workspaceGrid(page);
  const items = grid.locator(".vuuGridLayoutItem");
  await expect(items).toHaveCount(2);
  return { grid, items };
};

const headerButton = (item: Locator, name: string) =>
  item
    .locator(":scope > .vuuGridLayoutItemHeader")
    .getByRole("button", { exact: true, name });

test.describe("PortalWorkspace maximize", () => {
  test("is off unless workspaces.maximizable is set", async ({
    mount,
    page,
  }) => {
    await mount(notMaximizable);
    const { grid } = await openMarkets(page);
    await expect(
      grid.locator(".vuuGridLayoutItemHeader").getByRole("button", {
        exact: true,
        name: "Close",
      }),
    ).toHaveCount(2);
    await expect(
      grid.getByRole("button", { exact: true, name: "Maximize" }),
    ).toHaveCount(0);
  });

  test("panel headers offer Maximize and Restore", async ({ mount, page }) => {
    await mount(maximizable);
    const { grid, items } = await openMarkets(page);
    const chart = grid.locator(".vuuGridLayoutItem", {
      hasText: "Intraday prices",
    });
    const other = items.filter({ hasNotText: "Intraday prices" });
    await expect(
      grid.getByRole("button", { exact: true, name: "Maximize" }),
    ).toHaveCount(2);

    await headerButton(chart, "Maximize").click();
    await expect(chart).toHaveAttribute("data-maximized", "true");
    await expect(other).toBeHidden();
    await expect(headerButton(chart, "Restore")).toBeFocused();

    await headerButton(chart, "Restore").click();
    await expect(chart).not.toHaveAttribute("data-maximized");
    await expect(other).toBeVisible();
    await expect(headerButton(chart, "Maximize")).toBeFocused();

    // Maximize is view state, not an edit: the system workspace stays as
    // it is, without a personal copy.
    await expect(
      page
        .getByRole("link", { name: "Markets" })
        .locator('[data-workspace-tag="personal-copy"]'),
    ).toHaveCount(0);
  });
});
