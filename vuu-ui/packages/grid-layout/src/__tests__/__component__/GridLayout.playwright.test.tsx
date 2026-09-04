import { expect, test } from "../../../../../playwright/fixtures";
import { GridLayoutDriver } from "./GridLayoutDriver";

const fixture = "GridLayout/GridLayoutTestFixture/GridLayoutTestFixture";

test.describe("GridLayout browser interactions", () => {
  test.describe.configure({ mode: "serial" });

  test("renders items at their declared CSS Grid positions", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "basic" });
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
      const component = await mount(fixture, { variant: "basic" });
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
    const component = await mount(fixture, { variant: "basic" });
    const grid = new GridLayoutDriver(component, page);

    await grid.dragItem("beta", "alpha", "centre");

    await expect(grid.item("alpha")).toHaveCount(0);
    await expect(grid.item("beta")).toBeVisible();
    expect(await grid.gridArea("beta")).toBe("1/1/2/2");
  });

  test("header drop creates a tabbed stack", async ({ mount, page }) => {
    const component = await mount(fixture, { variant: "basic" });
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
    await mount(fixture, { variant: "stacked" });

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

  test("a cancelled tab drag leaves the tabstrip interactive", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "stacked" });
    await page.clock.install();

    const alphaTab = component.getByRole("tab", { name: "Alpha" });
    const draggableTab = alphaTab.locator(
      "xpath=ancestor::*[contains(concat(' ', normalize-space(@class), ' '), ' vuuDraggableItem ')][1]",
    );
    const tabList = component.getByRole("tablist");
    const dataTransfer = await page.evaluateHandle(() => new DataTransfer());

    await draggableTab.dispatchEvent("dragstart", { dataTransfer });
    await draggableTab.dispatchEvent("dragend", { dataTransfer });
    await page.clock.fastForward(100);

    await expect(draggableTab).not.toHaveClass(/vuuDraggableItem-hidden/);
    await expect(tabList).not.toHaveClass(/vuuDragContainer-dragging/);
    await expect(alphaTab).toHaveAttribute("aria-selected", "true");
    await expect(component.getByTestId("content-alpha")).toBeVisible();

    const committedDataTransfer = await page.evaluateHandle(
      () => new DataTransfer(),
    );
    await draggableTab.dispatchEvent("dragstart", {
      dataTransfer: committedDataTransfer,
    });
    await page.clock.fastForward(100);
    await expect(draggableTab).toHaveClass(/vuuDraggableItem-hidden/);

    await draggableTab.dispatchEvent("dragend", {
      dataTransfer: committedDataTransfer,
    });
    await expect(draggableTab).not.toHaveClass(/vuuDraggableItem-hidden/);
    await expect(tabList).not.toHaveClass(/vuuDragContainer-dragging/);
    await expect(alphaTab).toHaveAttribute("aria-selected", "true");
    await expect(component.getByTestId("content-alpha")).toBeVisible();

    await component.getByRole("tab", { name: "Beta" }).click();
    await expect(component.getByTestId("content-beta")).toBeVisible();
  });

  test("quick tab selection movements do not start or reorder a drag", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "stacked" });
    const tabs = component.getByRole("tab");
    const tabList = component.getByRole("tablist");
    const labelsBefore = await tabs.allTextContents();

    const betaTab = component.getByRole("tab", { name: "Beta" });
    const box = await betaTab.boundingBox();
    if (!box) {
      throw Error("Expected Beta tab to have a bounding box");
    }

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 10, box.y + box.height / 2, {
      steps: 10,
    });
    await page.mouse.up();

    await expect(betaTab).toHaveAttribute("aria-selected", "true");
    expect(await tabs.allTextContents()).toEqual(labelsBefore);
    await expect(tabList).not.toHaveClass(/vuuDragContainer-dragging/);
    await expect(component.locator(".vuuDraggableItem-hidden")).toHaveCount(0);
  });

  test("pressing before movement still starts an intentional tab drag", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "stacked" });
    const alphaTab = component.getByRole("tab", { name: "Alpha" });
    const tabList = component.getByRole("tablist");
    const box = await alphaTab.boundingBox();
    if (!box) {
      throw Error("Expected Alpha tab to have a bounding box");
    }

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(175);
    await page.mouse.move(box.x + box.width / 2 + 10, box.y + box.height / 2, {
      steps: 10,
    });

    await expect(tabList).toHaveClass(/vuuDragContainer-dragging/);
    await page.mouse.up();
    await expect(tabList).not.toHaveClass(/vuuDragContainer-dragging/);
    await expect(alphaTab).toHaveAttribute("aria-selected", "true");
  });

  test("a fast tab drop completes before delayed drag styling", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "stacked-target" });
    const sourceTab = component
      .getByRole("tab", { name: "Alpha" })
      .locator(
        "xpath=ancestor::*[contains(concat(' ', normalize-space(@class), ' '), ' vuuDraggableItem ')][1]",
      );
    const target = component.getByTestId("content-target");
    const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
    const { clientX, clientY } = await target.evaluate((element) => {
      const box = element.getBoundingClientRect();
      return {
        clientX: box.x + box.width / 2,
        clientY: box.y + box.height * 0.1,
      };
    });
    const dragEvent = { clientX, clientY, dataTransfer };

    await sourceTab.dispatchEvent("dragstart", { dataTransfer });
    await target.dispatchEvent("dragenter", dragEvent);
    await target.dispatchEvent("dragover", dragEvent);
    await target.dispatchEvent("dragover", dragEvent);
    await target.dispatchEvent("drop", dragEvent);
    await component.dispatchEvent("dragend", dragEvent);

    await expect(component.getByTestId("content-alpha")).toBeVisible();
    await expect(component.getByTestId("content-target")).toBeVisible();
    await expect(component.getByRole("tab", { name: "Alpha" })).toHaveCount(0);
    await expect(component.locator(".vuuDraggableItem-hidden")).toHaveCount(0);
    await expect(component.locator(".vuuDragContainer-dragging")).toHaveCount(
      0,
    );
  });

  test("close removes a component and reflows the remaining item", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "basic" });
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
    const component = await mount(fixture, { variant: "irregular-removal" });
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
    const component = await mount(fixture, { variant: "resizable" });
    const grid = new GridLayoutDriver(component, page);
    const before = await grid.item("flexible").boundingBox();

    await grid.resize(grid.separator(), 40);

    const after = await grid.item("flexible").boundingBox();
    expect(Math.abs((after?.x ?? 0) - (before?.x ?? 0))).toBeGreaterThan(30);
  });

  test("splitter resize preserves a moved layout after onChange rerenders", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "change-rerender" });
    const grid = new GridLayoutDriver(component, page);

    await grid.dragItem("rerender-alpha", "rerender-beta", "north");
    expect(await grid.gridArea("rerender-alpha")).toBe("1/1/2/2");
    expect(await grid.gridArea("rerender-beta")).toBe("2/1/3/2");

    await grid.resize(grid.separator("horizontal"), 0, 40);

    expect(await grid.gridArea("rerender-alpha")).toBe("1/1/2/2");
    expect(await grid.gridArea("rerender-beta")).toBe("2/1/3/2");
  });

  test("renders a shared splitter when only one track item opts into resizing", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, {
      variant: "mixed-resizable-boundary",
    });
    const grid = new GridLayoutDriver(component, page);
    const before = await grid.item("nav").boundingBox();

    await expect(grid.separator()).toHaveCount(1);
    await grid.resize(grid.separator(), 40);

    const nav = await grid.item("nav").boundingBox();
    const toolbar = await grid.item("toolbar").boundingBox();
    const content = await grid.item("content").boundingBox();
    expect((nav?.width ?? 0) - (before?.width ?? 0)).toBeGreaterThan(30);
    expect(toolbar?.x).toBeCloseTo(content?.x ?? 0, 0);
  });

  test("positions a vertical splitter below an intersecting horizontal splitter", async ({
    mount,
    page,
  }) => {
    const component = await mount(
      "GridLayout/GridLayoutScenarios/MixedRowAndColumnSpans",
    );
    const grid = new GridLayoutDriver(component, page);
    const horizontal = await grid
      .item("span-left-top-splitter-v")
      .boundingBox();
    const verticalSplitter = grid.item("span-right-splitter-h");
    const vertical = await verticalSplitter.boundingBox();
    const verticalGrabZone = await verticalSplitter
      .locator(".vuu-grab-zone")
      .boundingBox();
    const horizontalEnd = (horizontal?.y ?? 0) + (horizontal?.height ?? 0);

    expect(vertical?.y).toBeGreaterThanOrEqual(horizontalEnd);
    expect(verticalGrabZone?.y).toBeGreaterThanOrEqual(horizontalEnd);
  });

  test("proportional row resize keeps equal lower rows equal", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "proportional" });
    const grid = new GridLayoutDriver(component, page);
    const splitter = grid.item("proportional-middle-splitter-v");
    const headerBefore = await grid.item("proportional-header").boundingBox();
    const topBefore = await grid.item("proportional-middle").boundingBox();
    const bottomBefore = await grid.item("proportional-bottom").boundingBox();

    await grid.resize(splitter, 0, 60);

    const headerAfter = await grid.item("proportional-header").boundingBox();
    const topAfter = await grid.item("proportional-middle").boundingBox();
    const bottomAfter = await grid.item("proportional-bottom").boundingBox();
    const topReduction = (topBefore?.height ?? 0) - (topAfter?.height ?? 0);
    const bottomReduction =
      (bottomBefore?.height ?? 0) - (bottomAfter?.height ?? 0);
    expect(
      (headerAfter?.height ?? 0) - (headerBefore?.height ?? 0),
    ).toBeCloseTo(60, 0);
    expect(topReduction).toBeGreaterThan(25);
    expect(bottomReduction).toBeCloseTo(topReduction, 0);
  });

  test("proportional row resize preserves unequal lower-row ratios", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, {
      variant: "proportional-unequal",
    });
    const grid = new GridLayoutDriver(component, page);
    const topBefore = await grid.item("proportional-middle").boundingBox();
    const bottomBefore = await grid.item("proportional-bottom").boundingBox();

    await grid.resize(grid.item("proportional-middle-splitter-v"), 0, 60);

    const top = await grid.item("proportional-middle").boundingBox();
    const bottom = await grid.item("proportional-bottom").boundingBox();
    const ratioBefore = (bottomBefore?.height ?? 0) / (topBefore?.height ?? 1);
    expect((bottom?.height ?? 0) / (top?.height ?? 1)).toBeCloseTo(
      ratioBefore,
      1,
    );
  });

  test("proportional row resize redistributes contraction at a track minimum", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, {
      variant: "proportional-minimums",
    });
    const grid = new GridLayoutDriver(component, page);
    const middleBefore = await grid.item("proportional-middle").boundingBox();
    const bottomBefore = await grid.item("proportional-bottom").boundingBox();

    await grid.resize(grid.item("proportional-middle-splitter-v"), 0, 100);

    const middle = await grid.item("proportional-middle").boundingBox();
    const bottom = await grid.item("proportional-bottom").boundingBox();
    expect(middle?.height).toBeCloseTo(160, 0);
    const middleReduction = (middleBefore?.height ?? 0) - (middle?.height ?? 0);
    const bottomReduction = (bottomBefore?.height ?? 0) - (bottom?.height ?? 0);
    expect(bottomReduction).toBeGreaterThan(middleReduction + 20);
  });

  test("proportional row resize restores initial ratios when the pointer returns", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, {
      variant: "proportional-minimums",
    });
    const grid = new GridLayoutDriver(component, page);
    const middleBefore = await grid.item("proportional-middle").boundingBox();
    const bottomBefore = await grid.item("proportional-bottom").boundingBox();

    await grid.resizeAndReturn(
      grid.item("proportional-middle-splitter-v"),
      0,
      100,
    );

    const middle = await grid.item("proportional-middle").boundingBox();
    const bottom = await grid.item("proportional-bottom").boundingBox();
    expect(middle?.height).toBeCloseTo(middleBefore?.height ?? 0, 0);
    expect(bottom?.height).toBeCloseTo(bottomBefore?.height ?? 0, 0);
  });

  test("coupled cross-boundary spans retain safe adjacent resizing", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, {
      variant: "proportional-coupled",
    });
    const grid = new GridLayoutDriver(component, page);
    const crossingBefore = await grid.item("coupled-crossing").boundingBox();
    const before = await grid.item("coupled-before").boundingBox();

    await grid.resize(grid.item("coupled-after-splitter-v"), 0, 60);

    const crossing = await grid.item("coupled-crossing").boundingBox();
    const resizedBefore = await grid.item("coupled-before").boundingBox();
    expect(crossing?.height).toBeCloseTo(crossingBefore?.height ?? 0, 0);
    expect((resizedBefore?.height ?? 0) - (before?.height ?? 0)).toBeCloseTo(
      60,
      0,
    );
  });

  test("splitter stops at explicit and default minimum widths with fractional tracks", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "resizable" });
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
    const component = await mount(fixture, { variant: "resizable-vertical" });
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
    const component = await mount(fixture, { variant: "non-resizable" });
    const grid = new GridLayoutDriver(component, page);

    await expect(grid.item("fixed-left")).toBeVisible();
    await expect(grid.item("fixed-right")).toBeVisible();
    await expect(grid.separator()).toHaveCount(0);
  });

  test("rejects split drops onto a non-resizable item", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "split-constraints" });
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
    const component = await mount(fixture, { variant: "nested" });
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

  test("drops a parent palette template into nested grid content", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "nested-palette" });
    const grid = new GridLayoutDriver(component, page);

    await grid.dragTemplate(
      component.getByTestId("palette-item-1"),
      grid.content("nested-target"),
      "north",
    );

    const templateItem = component
      .locator(".vuuGridLayoutItemHeader-title", {
        hasText: /^Template A$/,
      })
      .locator("xpath=../..");
    await expect(templateItem).toHaveCount(1);
    await expect(templateItem).toBeVisible();
    await expect(
      templateItem.locator(
        "xpath=ancestor::div[contains(concat(' ', normalize-space(@class), ' '), ' vuuGridLayout ')][1]",
      ),
    ).toHaveAttribute("id", "nested-grid");
    expect(await grid.gridArea("nested-owner")).toBe("1/2/2/3");
    await expect(component.locator(".vuuGridPlaceholder")).toHaveCount(0);
  });

  test("drops a parent palette template into a nested tabstrip", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "nested-palette" });
    const grid = new GridLayoutDriver(component, page);

    await grid.dragTemplateToTabs(
      component.getByTestId("palette-item-2"),
      component.getByRole("tablist"),
    );

    await expect(component.getByRole("tab")).toHaveCount(3);
    await expect(
      component.getByRole("tab", { name: "Template B" }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(
      component.locator('[data-testid="template-content"]', {
        hasText: "Template B",
      }),
    ).toBeVisible();
    await expect(component.locator(".vuuGridPlaceholder")).toHaveCount(0);
  });

  test("drops a palette template after selecting a hidden nested layout tab", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, {
      variant: "nested-palette-tabs",
    });
    const grid = new GridLayoutDriver(component, page);

    await component.getByRole("tab", { name: "Navy Layout" }).click();
    await expect(grid.item("navy")).toBeVisible();

    await grid.dragTemplate(
      component.getByTestId("palette-item-1"),
      grid.content("navy"),
      "north",
    );

    const templateItem = component
      .locator(".vuuGridLayoutItemHeader-title", {
        hasText: /^Template A$/,
      })
      .locator("xpath=../..");
    await expect(templateItem).toHaveCount(1);
    await expect(templateItem).toBeVisible();
    await expect(
      templateItem.locator(
        "xpath=ancestor::div[contains(concat(' ', normalize-space(@class), ' '), ' vuuGridLayout ')][1]",
      ),
    ).toHaveAttribute("id", "navy-layout");
    await expect(component.getByRole("tab")).toHaveCount(2);
    await component.getByRole("tab", { name: "Brown Layout" }).click();
    await expect(grid.item("brown")).toBeVisible();
  });

  test("palette item closes and reflows before the next split", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "palette-target" });
    const grid = new GridLayoutDriver(component, page);

    await grid.dragTemplate(
      component.getByTestId("palette-item-1"),
      grid.content("palette-target"),
      "north",
    );
    const firstTemplate = component
      .locator(".vuuGridLayoutItemHeader-title", { hasText: /^Template A$/ })
      .locator("xpath=../..");
    await firstTemplate.locator(".vuuGridLayoutItemHeader-close").click();

    await expect(firstTemplate).toHaveCount(0);
    expect(await grid.gridArea("palette-target")).toBe("1/2/2/3");

    await grid.dragTemplate(
      component.getByTestId("palette-item-2"),
      grid.content("palette-target"),
      "west",
    );
    const secondTemplate = component
      .locator(".vuuGridLayoutItemHeader-title", { hasText: /^Template B$/ })
      .locator("xpath=../..");
    const secondTemplateId = await secondTemplate.getAttribute("id");
    if (!secondTemplateId) {
      throw Error("Palette-created item has no id");
    }
    expect(await grid.gridArea(secondTemplateId)).toBe("1/2/2/3");
    expect(await grid.gridArea("palette-target")).toBe("1/3/2/4");
    await expect(component.locator(".vuuGridPlaceholder")).toHaveCount(0);
  });

  test("palette header and tab-list drops select the new tabs", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "palette-target" });
    const grid = new GridLayoutDriver(component, page);

    await grid.dragTemplate(
      component.getByTestId("palette-item-1"),
      grid.item("palette-target").locator(".vuuGridLayoutItemHeader"),
      "header",
    );

    const tabs = component.getByRole("tab");
    await expect(tabs).toHaveCount(2);
    await expect(
      component.getByRole("tab", { name: "Template A" }),
    ).toHaveAttribute("aria-selected", "true");

    await grid.dragTemplateToTabs(
      component.getByTestId("palette-item-2"),
      component.getByRole("tablist"),
    );

    await expect(tabs).toHaveCount(3);
    await expect(
      component.getByRole("tab", { name: "Template B" }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(
      component.locator('[data-testid="template-content"]', {
        hasText: "Template B",
      }),
    ).toBeVisible();
  });

  test("resizes a south split after a palette header drop creates a stack", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "palette-target" });
    const grid = new GridLayoutDriver(component, page);

    await grid.dragTemplate(
      component.getByTestId("palette-item-1"),
      grid.content("palette-target"),
      "south",
    );
    const templateHeader = component.locator(".vuuGridLayoutItemHeader-title", {
      hasText: /^Template A$/,
    });
    const templateItem = templateHeader.locator(
      "xpath=ancestor::div[contains(concat(' ', normalize-space(@class), ' '), ' vuuGridLayoutItem ')][1]",
    );

    await grid.dragTemplate(
      component.getByTestId("palette-item-2"),
      templateItem.locator(".vuuGridLayoutItemHeader"),
      "header",
    );

    const stack = component
      .getByRole("tablist")
      .locator(
        "xpath=ancestor::div[contains(concat(' ', normalize-space(@class), ' '), ' vuuGridLayoutItem ')][1]",
      );
    const targetBefore = await grid.item("palette-target").boundingBox();
    const stackBefore = await stack.boundingBox();
    await grid.resize(grid.separator("horizontal"), 0, 40);
    const targetAfter = await grid.item("palette-target").boundingBox();
    const stackAfter = await stack.boundingBox();

    expect(targetAfter?.height).not.toBeCloseTo(targetBefore?.height ?? 0, 0);
    expect(stackAfter?.height).not.toBeCloseTo(stackBefore?.height ?? 0, 0);
    await expect(
      component.getByRole("tab", { name: "Template A" }),
    ).toBeVisible();
    await expect(
      component.getByRole("tab", { name: "Template B" }),
    ).toBeVisible();
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
