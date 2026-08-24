import { expect, test } from "@playwright/experimental-ct-react";
import { GridLayoutDriver } from "./GridLayoutDriver";
import { GridLayoutTestFixture } from "./GridLayoutTestFixture";

test.describe("GridLayout browser interactions", () => {
  test.describe.configure({ mode: "serial" });

  test("renders items at their declared CSS Grid positions", async ({
    mount,
    page,
  }) => {
    const component = await mount(<GridLayoutTestFixture variant="basic" />);
    const grid = new GridLayoutDriver(component, page);

    await expect(grid.item("alpha")).toBeVisible();
    await expect(grid.item("beta")).toBeVisible();
    expect(await grid.gridArea("alpha")).toBe("1/1/2/2");
    expect(await grid.gridArea("beta")).toBe("1/2/2/3");

    const alpha = await grid.item("alpha").boundingBox();
    const beta = await grid.item("beta").boundingBox();
    expect(alpha?.x).toBeLessThan(beta?.x ?? 0);
    expect(alpha?.width).toBeGreaterThan(250);
    expect(beta?.width).toBeGreaterThan(250);
  });

  for (const direction of ["north", "south", "east", "west"] as const) {
    test(`moves an existing component into the ${direction} split zone`, async ({
      mount,
      page,
    }) => {
      const component = await mount(<GridLayoutTestFixture variant="basic" />);
      const grid = new GridLayoutDriver(component, page);

      await grid.dragItem("beta", "alpha", direction);

      await expect(grid.item("alpha")).toBeVisible();
      await expect(grid.item("beta")).toBeVisible();
      const alpha = await grid.item("alpha").boundingBox();
      const beta = await grid.item("beta").boundingBox();
      if (direction === "east") {
        expect(beta?.x).toBeGreaterThan(alpha?.x ?? 0);
      } else if (direction === "west") {
        expect(beta?.x).toBeLessThan(alpha?.x ?? 0);
      } else if (direction === "north") {
        expect(beta?.y).toBeLessThan(alpha?.y ?? 0);
      } else {
        expect(beta?.y).toBeGreaterThan(alpha?.y ?? 0);
      }
    });
  }

  test("centre drop replaces the target component", async ({ mount, page }) => {
    const component = await mount(<GridLayoutTestFixture variant="basic" />);
    const grid = new GridLayoutDriver(component, page);

    await grid.dragItem("beta", "alpha", "centre");

    await expect(grid.item("alpha")).toHaveCount(0);
    await expect(grid.item("beta")).toBeVisible();
    expect(await grid.gridArea("beta")).toBe("1/1/2/2");
  });

  test("header drop creates a tabbed stack", async ({ mount, page }) => {
    const component = await mount(<GridLayoutTestFixture variant="basic" />);
    const grid = new GridLayoutDriver(component, page);

    await grid.drag(
      grid.header("beta"),
      grid.item("alpha").locator(".vuuGridLayoutItemHeader"),
      "header",
    );

    await expect(page.getByRole("tab", { name: "Alpha" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Beta" })).toBeVisible();
  });

  test("adds, renames, selects and closes tabs through the tab UI", async ({
    mount,
    page,
  }) => {
    await mount(<GridLayoutTestFixture variant="stacked" />);

    await page.getByRole("button", { name: "Create Tab" }).click();
    await page.getByLabel("New tab name").fill("Gamma");
    await page.getByRole("button", { name: "Confirm" }).click();
    await expect(page.getByRole("tab", { name: "Gamma" })).toBeVisible();

    await page.getByRole("button", { name: "Gamma Settings" }).click();
    await page.getByRole("menuitem", { name: "Rename" }).click();
    await page.getByLabel("New tab name").fill("Gamma renamed");
    await page.getByRole("button", { name: "Confirm" }).click();
    await expect(
      page.getByRole("tab", { name: "Gamma renamed" }),
    ).toBeVisible();

    await page.getByRole("tab", { name: "Beta" }).click();
    await expect(page.getByRole("tab", { name: "Beta" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.getByTestId("content-beta")).toBeVisible();
    await page.getByRole("button", { name: "Gamma renamed Settings" }).click();
    await page.getByRole("menuitem", { name: "Close" }).click();
    await expect(page.getByRole("tab", { name: "Gamma renamed" })).toHaveCount(
      0,
    );
  });

  test("close removes a component and reflows the remaining item", async ({
    mount,
    page,
  }) => {
    const component = await mount(<GridLayoutTestFixture variant="basic" />);
    const grid = new GridLayoutDriver(component, page);

    await grid.item("beta").getByRole("button").click();

    await expect(grid.item("beta")).toHaveCount(0);
    await expect(grid.item("alpha")).toBeVisible();
    expect(await grid.gridArea("alpha")).toBe("1/1/2/2");
  });

  test("close normalizes multiple unused row and column lines", async ({
    mount,
    page,
  }) => {
    const component = await mount(
      <GridLayoutTestFixture variant="irregular-removal" />,
    );
    const grid = new GridLayoutDriver(component, page);

    await grid.item("removed").getByRole("button").click();

    await expect(grid.item("removed")).toHaveCount(0);
    expect(await grid.gridArea("survivor")).toBe("1/1/2/2");
    const survivor = await grid.item("survivor").boundingBox();
    expect(survivor?.width).toBeGreaterThan(600);
    expect(survivor?.height).toBeGreaterThan(300);
  });

  test("splitter drag resizes a resizable boundary", async ({
    mount,
    page,
  }) => {
    const component = await mount(
      <GridLayoutTestFixture variant="resizable" />,
    );
    const grid = new GridLayoutDriver(component, page);
    const before = await grid.item("flexible").boundingBox();

    await grid.resize(grid.separator(), 40);

    const after = await grid.item("flexible").boundingBox();
    expect(Math.abs((after?.x ?? 0) - (before?.x ?? 0))).toBeGreaterThan(30);
  });

  test("splitter stops at explicit and default minimum widths with fractional tracks", async ({
    mount,
    page,
  }) => {
    const component = await mount(
      <GridLayoutTestFixture variant="resizable" />,
    );
    const grid = new GridLayoutDriver(component, page);

    await grid.resize(grid.separator(), 1_000);
    const defaultMinimum = await grid.item("flexible").boundingBox();
    expect(defaultMinimum?.width).toBeCloseTo(80, 0);

    await grid.resize(grid.separator(), -1_000);
    const explicitMinimum = await grid.item("fixed").boundingBox();
    expect(explicitMinimum?.width).toBeCloseTo(150, 0);
  });

  test("splitter stops at explicit and default minimum heights", async ({
    mount,
    page,
  }) => {
    const component = await mount(
      <GridLayoutTestFixture variant="resizable-vertical" />,
    );
    const grid = new GridLayoutDriver(component, page);

    await grid.resize(grid.separator(), 0, 1_000);
    const defaultMinimum = await grid.item("bottom").boundingBox();
    expect(defaultMinimum?.height).toBeCloseTo(80, 0);

    await grid.resize(grid.separator(), 0, -1_000);
    const explicitMinimum = await grid.item("top").boundingBox();
    expect(explicitMinimum?.height).toBeCloseTo(120, 0);
  });

  test("does not render splitters when adjacent items are non-resizable", async ({
    mount,
    page,
  }) => {
    const component = await mount(
      <GridLayoutTestFixture variant="non-resizable" />,
    );
    const grid = new GridLayoutDriver(component, page);

    await expect(grid.item("fixed-left")).toBeVisible();
    await expect(grid.item("fixed-right")).toBeVisible();
    await expect(grid.separator()).toHaveCount(0);
  });

  test("rejects split drops onto a non-resizable item", async ({
    mount,
    page,
  }) => {
    const component = await mount(
      <GridLayoutTestFixture variant="split-constraints" />,
    );
    const grid = new GridLayoutDriver(component, page);

    await grid.dragItem("movable", "locked", "east");

    await expect(grid.item("movable")).toBeVisible();
    await expect(grid.item("locked")).toBeVisible();
    expect(await grid.gridArea("movable")).toBe("1/1/2/2");
    expect(await grid.gridArea("locked")).toBe("1/2/2/3");
  });

  test("isolates parent and nested GridLayout drag contexts", async ({
    mount,
    page,
  }) => {
    const component = await mount(<GridLayoutTestFixture variant="nested" />);
    const grid = new GridLayoutDriver(component, page);

    expect(
      await grid.attemptRejectedDrag(
        grid.header("parent-peer"),
        grid.content("nested-one"),
        "centre",
      ),
    ).toBe(false);
    expect(
      await grid.attemptRejectedDrag(
        grid.header("nested-one"),
        grid.content("parent-peer"),
        "centre",
      ),
    ).toBe(false);

    await expect(grid.item("parent-peer")).toBeVisible();
    await expect(grid.item("nested-one")).toBeVisible();
    expect(await grid.gridArea("parent-peer")).toBe("1/2/2/3");
    expect(await grid.gridArea("nested-one")).toBe("1/1/2/2");

    await grid.dragItem("nested-one", "nested-two", "south");
    const nestedOne = await grid.item("nested-one").boundingBox();
    const nestedTwo = await grid.item("nested-two").boundingBox();
    expect(nestedOne?.y).toBeGreaterThan(nestedTwo?.y ?? 0);
  });

  test.fixme("palette template drop onto an empty placeholder", async () => {
    // Native template drag currently depends on unstable placeholder drag-enter
    // sequencing in Playwright CT.
  });

  test.fixme("palette template centre drop replaces existing content", async () => {
    // The template path works in the showcase, but native DataTransfer delivery
    // from the compact palette fixture is not deterministic in CT.
  });

  test.fixme("reorders tabs by dragging within a tabstrip", async () => {
    // Tab reordering uses delayed spacer animation that Playwright's dragTo
    // cannot currently drive deterministically.
  });
});
