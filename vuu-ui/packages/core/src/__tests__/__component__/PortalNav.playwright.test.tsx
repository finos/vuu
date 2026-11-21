import type { Locator } from "@playwright/test";
import { expect, test } from "../../../../../playwright/fixtures";

const navColumnWidth = async (component: Locator) =>
  component
    .locator(".vuuPortalNav")
    .evaluate((el) => Math.round(el.getBoundingClientRect().width));

test.describe("PortalNav", () => {
  test("sizes the shell column to the display mode and toggles with Ctrl+B", async ({
    mount,
    page,
  }) => {
    const component = await mount("VuuPortal/PortalNav/IconsAndText");
    const nav = component.getByRole("navigation", { name: "Main navigation" });
    await expect(nav).toBeVisible();
    await expect.poll(() => navColumnWidth(component)).toBe(248);

    await component
      .getByRole("button", { name: "Collapse navigation" })
      .click();
    await expect.poll(() => navColumnWidth(component)).toBe(60);
    await expect(
      component.getByRole("button", { name: "Expand navigation" }),
    ).toBeVisible();

    await page.keyboard.press("Control+b");
    await expect.poll(() => navColumnWidth(component)).toBe(248);

    await component.getByText("Text", { exact: true }).click();
    await expect.poll(() => navColumnWidth(component)).toBe(208);
  });

  test("navigates and marks the active item", async ({ mount }) => {
    const component = await mount("VuuPortal/PortalNav/IconsAndText");
    const orders = component.getByRole("link", { name: "Orders" });
    await orders.click();
    await expect(orders).toHaveAttribute("aria-current", "page");
    await expect(orders).toHaveClass(/vuuPortalNav-link-active/);
  });

  test("shows a tooltip and a badge pip in the rail", async ({
    mount,
    page,
  }) => {
    const component = await mount("VuuPortal/PortalNav/IconsRail");
    const orders = component.getByRole("link", { name: "Orders" });
    await expect(orders.locator(".vuuPortalNav-pip")).toBeAttached();
    await orders.hover();
    await expect(page.getByRole("tooltip")).toHaveText("Orders");
    // Sections are separated, not headed.
    await expect(component.locator(".vuuPortalNav-sectionHeading")).toHaveCount(
      0,
    );
  });

  test("opens the minimized nav as an overlay that closes on navigation", async ({
    mount,
  }) => {
    const component = await mount("VuuPortal/PortalNav/Minimized");
    await expect.poll(() => navColumnWidth(component)).toBe(0);
    const handle = component.getByRole("button", { name: "Open navigation" });
    await handle.click();
    const overlay = component.getByRole("navigation", {
      name: "Main navigation",
    });
    await expect(overlay).toBeVisible();
    await overlay.getByRole("link", { name: "Positions" }).click();
    await expect(overlay).toHaveCount(0);
    await expect(handle).toHaveAttribute("aria-expanded", "false");
  });

  test("collapses sections", async ({ mount }) => {
    const component = await mount("VuuPortal/PortalNav/CollapsibleSections");
    const trading = component.getByRole("button", { name: "Trading" });
    await expect(component.getByRole("link", { name: "Orders" })).toBeVisible();
    await trading.click();
    await expect(trading).toHaveAttribute("aria-expanded", "false");
    await expect(component.getByRole("link", { name: "Orders" })).toBeHidden();
  });

  test("shows a notification dot", async ({ mount }) => {
    const component = await mount("VuuPortal/PortalNav/IconsAndText");
    await expect(component.locator(".vuuPortalNav-indicator")).toHaveCount(0);
    await component
      .getByRole("button", { name: "Simulate a notification" })
      .click();
    await expect(component.locator(".vuuPortalNav-indicator")).toHaveCount(1);
  });
});
