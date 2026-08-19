import { expect, test } from "../../../../../playwright/fixtures";
import type { Locator } from "@playwright/test";
import { GridLayoutDriver } from "./GridLayoutDriver";

const fixture = "GridLayout/GridLayoutTestFixture/GridLayoutTestFixture";
const observeTrustedNativeDrag = async (
  component: Locator,
  target: Locator,
  affordance: string,
) => {
  await target.evaluate((element, affordanceClass) => {
    element.setAttribute("data-native-drop-observer", affordanceClass);
  }, affordance);
  await component.evaluate(
    (root, { affordanceClass }) => {
      root.addEventListener(
        "dragstart",
        (event) => {
          root.setAttribute("data-native-dragstart", String(event.isTrusted));
        },
        true,
      );
      root.addEventListener(
        "pointercancel",
        (event) => {
          root.setAttribute(
            "data-native-pointercancel",
            String(event.isTrusted),
          );
        },
        true,
      );
      const targetElement = root.querySelector(
        `[data-native-drop-observer="${affordanceClass}"]`,
      );
      if (!targetElement) {
        throw Error("Native drop observer target not found");
      }
      const observer = new MutationObserver(() => {
        if (targetElement.classList.contains(affordanceClass)) {
          root.setAttribute("data-native-affordance", affordanceClass);
          observer.disconnect();
        }
      });
      observer.observe(targetElement, { attributeFilter: ["class"] });
    },
    { affordanceClass: affordance },
  );
};

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

  test("native existing-item drag shows an affordance and moves the item", async ({
    mount,
    page,
  }) => {
    const component = await mount("GridLayout/Showcase/MoveExistingItems");
    await page.waitForTimeout(250);
    const grid = new GridLayoutDriver(component, page);
    const target = grid.content("move-target");
    await observeTrustedNativeDrag(component, target, "vuuDropTarget-south");

    await grid.nativeDrag(grid.header("move-source"), target, "south");

    await expect(component).toHaveAttribute("data-native-dragstart", "true");
    await expect(component).toHaveAttribute(
      "data-native-pointercancel",
      "true",
    );
    await expect(component).toHaveAttribute(
      "data-native-affordance",
      "vuuDropTarget-south",
    );
    const targetBox = await grid.item("move-target").boundingBox();
    const sourceBox = await grid.item("move-source").boundingBox();
    expect(sourceBox?.y).toBeGreaterThan(targetBox?.y ?? 0);
    await expect(component.locator('[class*="vuuDropTarget-"]')).toHaveCount(0);
    await expect(grid.item("move-source")).not.toHaveClass(
      /vuuGridLayoutItem-dragging/,
    );
  });

  test("native GridPalette swatch drag creates a south split", async ({
    mount,
    page,
  }) => {
    const component = await mount("GridLayout/Showcase/PaletteSplitAndReplace");
    await page.waitForTimeout(250);
    const grid = new GridLayoutDriver(component, page);
    const source = component.locator('[data-item-id="coral"]');
    const target = grid.content("palette-target");
    await observeTrustedNativeDrag(component, target, "vuuDropTarget-south");

    await grid.nativeDrag(source, target, "south");

    await expect(component).toHaveAttribute("data-native-dragstart", "true");
    await expect(component).toHaveAttribute(
      "data-native-affordance",
      "vuuDropTarget-south",
    );
    const templateItem = component
      .getByText("Coral template")
      .locator("xpath=ancestor::*[contains(@class, 'vuuGridLayoutItem')][1]");
    await expect(templateItem).toBeVisible();
    const targetBox = await grid.item("palette-target").boundingBox();
    const templateBox = await templateItem.boundingBox();
    expect(templateBox?.y).toBeGreaterThan(targetBox?.y ?? 0);
    await expect(target).not.toHaveClass(/vuuDropTarget-/);
    await expect(grid.layout("palette-replace")).not.toHaveClass(/vuuDragging/);
  });

  for (const direction of ["north", "east", "west"] as const) {
    test(`native GridPalette swatch drag creates a ${direction} split`, async ({
      mount,
      page,
    }) => {
      const component = await mount(
        "GridLayout/Showcase/PaletteSplitAndReplace",
      );
      await page.waitForTimeout(250);
      const grid = new GridLayoutDriver(component, page);
      const source = component.locator('[data-item-id="coral"]');
      const target = grid.content("palette-target");

      await grid.nativeDrag(source, target, direction);

      const templateItem = component
        .getByText("Coral template")
        .locator("xpath=ancestor::*[contains(@class, 'vuuGridLayoutItem')][1]");
      await expect(templateItem).toBeVisible();
      const targetBox = await grid.item("palette-target").boundingBox();
      const templateBox = await templateItem.boundingBox();
      if (direction === "north") {
        expect(templateBox?.y).toBeLessThan(targetBox?.y ?? 0);
      } else if (direction === "east") {
        expect(templateBox?.x).toBeGreaterThan(targetBox?.x ?? 0);
      } else {
        expect(templateBox?.x).toBeLessThan(targetBox?.x ?? 0);
      }
      await expect(component.locator('[class*="vuuDropTarget-"]')).toHaveCount(
        0,
      );
    });
  }

  test("native GridPalette centre drop replaces existing content", async ({
    mount,
    page,
  }) => {
    const component = await mount("GridLayout/Showcase/PaletteSplitAndReplace");
    await page.waitForTimeout(250);
    const grid = new GridLayoutDriver(component, page);

    await grid.nativeDrag(
      component.locator('[data-item-id="coral"]'),
      grid.content("palette-target"),
      "centre",
    );

    await expect(grid.item("palette-target")).toHaveCount(0);
    await expect(component.getByText("Coral template")).toBeVisible();
    await expect(component.locator('[class*="vuuDropTarget-"]')).toHaveCount(0);
  });

  test("native GridPalette swatch drag onto a header creates a stack", async ({
    mount,
    page,
  }) => {
    const component = await mount("GridLayout/Showcase/PaletteSplitAndReplace");
    await page.waitForTimeout(250);
    const grid = new GridLayoutDriver(component, page);
    const source = component.locator('[data-item-id="teal"]');
    const target = grid
      .item("palette-target")
      .locator(".vuuGridLayoutItemHeader");
    await observeTrustedNativeDrag(component, target, "vuuDropTarget-header");

    await grid.nativeDrag(source, target, "header");

    await expect(component).toHaveAttribute("data-native-dragstart", "true");
    await expect(component).toHaveAttribute(
      "data-native-affordance",
      "vuuDropTarget-header",
    );
    await expect(
      component.getByRole("tab", { name: "Drop target" }),
    ).toBeVisible();
    await expect(component.getByRole("tab", { name: "Teal" })).toBeVisible();
    await expect(component.locator('[class*="vuuDropTarget-"]')).toHaveCount(0);
    await expect(grid.layout("palette-replace")).not.toHaveClass(/vuuDragging/);
  });

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

  test("native target transitions replace the affordance and Escape cancels", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "basic" });
    const grid = new GridLayoutDriver(component, page);
    const sourceBox = await grid.header("beta").boundingBox();
    const targetBox = await grid.content("alpha").boundingBox();
    if (!sourceBox || !targetBox) {
      throw Error("Native transition test requires visible source and target");
    }
    const sourceX = sourceBox.x + sourceBox.width / 2;
    const sourceY = sourceBox.y + sourceBox.height / 2;

    await page.mouse.move(sourceX, sourceY);
    await page.mouse.down();
    await page.mouse.move(sourceX + 10, sourceY);
    await page.mouse.move(
      targetBox.x + targetBox.width / 2,
      targetBox.y + targetBox.height * 0.05,
      { steps: 20 },
    );
    await expect(grid.item("beta")).toHaveCount(0);
    await expect(grid.content("alpha")).toHaveClass(/vuuDropTarget-north/);
    const transitionedTargetBox = await grid.content("alpha").boundingBox();
    if (!transitionedTargetBox) {
      throw Error("Native transition target disappeared");
    }
    await page.mouse.move(
      transitionedTargetBox.x + transitionedTargetBox.width * 0.95,
      transitionedTargetBox.y + transitionedTargetBox.height / 2,
      { steps: 10 },
    );
    await expect(grid.content("alpha")).toHaveClass(/vuuDropTarget-east/);
    await expect(grid.content("alpha")).not.toHaveClass(/vuuDropTarget-north/);

    await page.keyboard.press("Escape");
    await page.mouse.up();

    expect(await grid.gridArea("alpha")).toBe("1/1/2/2");
    expect(await grid.gridArea("beta")).toBe("1/2/2/3");
    await expect(component.locator('[class*="vuuDropTarget-"]')).toHaveCount(0);
  });

  test("native proportional drag removes immediately, restores exactly, then relocates once", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, {
      variant: "proportional-removal-drag",
    });
    const grid = new GridLayoutDriver(component, page);
    const layout = grid.layout("proportional-removal-drag");
    const originalRows = await layout.evaluate(
      (element) => getComputedStyle(element).gridTemplateRows,
    );
    const originalColumns = await layout.evaluate(
      (element) => getComputedStyle(element).gridTemplateColumns,
    );
    const originalAreas = await Promise.all(
      [
        "proportional-header",
        "proportional-left-top",
        "proportional-left-bottom",
        "proportional-right",
      ].map((id) => grid.gridArea(id)),
    );
    const readSplitters = () =>
      grid.separator().evaluateAll((elements) =>
        elements.map((element) => ({
          controls: element.getAttribute("aria-controls"),
          orientation: element.getAttribute("aria-orientation"),
          resizedAfter: element.getAttribute("data-resized-child-items-after"),
          resizedBefore: element.getAttribute(
            "data-resized-child-items-before",
          ),
        })),
      );
    const originalSplitters = await readSplitters();

    await grid.startNativeDrag(
      grid.header("proportional-right"),
      grid.content("proportional-left-top"),
      "east",
    );

    await expect(grid.item("proportional-right")).toHaveCount(0);
    expect(await grid.gridArea("proportional-header")).toBe("1/1/2/2");
    expect(await grid.gridArea("proportional-left-top")).toBe("2/1/3/2");
    expect(await grid.gridArea("proportional-left-bottom")).toBe("3/1/4/2");
    await expect(grid.content("proportional-left-top")).toHaveClass(
      /vuuDropTarget-east/,
    );
    await expect(layout).toHaveCSS("grid-template-rows", originalRows);
    await expect(layout).not.toHaveCSS(
      "grid-template-columns",
      originalColumns,
    );
    expect(await readSplitters()).not.toEqual(originalSplitters);

    await page.keyboard.press("Escape");
    await grid.finishNativeDrag();

    await expect(grid.item("proportional-right")).toBeVisible();
    expect(
      await Promise.all(
        [
          "proportional-header",
          "proportional-left-top",
          "proportional-left-bottom",
          "proportional-right",
        ].map((id) => grid.gridArea(id)),
      ),
    ).toEqual(originalAreas);
    await expect(layout).toHaveCSS("grid-template-rows", originalRows);
    await expect(layout).toHaveCSS("grid-template-columns", originalColumns);
    expect(await readSplitters()).toEqual(originalSplitters);
    await expect(layout).toHaveAttribute("data-commit-count", "0");

    await grid.startNativeDrag(
      grid.header("proportional-right"),
      grid.content("proportional-left-top"),
      "east",
    );
    await expect(grid.item("proportional-right")).toHaveCount(0);
    await grid.finishNativeDrag();

    await expect(grid.item("proportional-right")).toBeVisible();
    await expect(grid.content("proportional-right")).toHaveText("Right");
    expect(await grid.gridArea("proportional-left-top")).toBe("2/1/3/2");
    expect(await grid.gridArea("proportional-right")).toBe("2/2/3/3");
    await expect(layout).toHaveAttribute("data-commit-count", "1");

    const separator = grid.separator("vertical").last();
    const sourceBefore = await grid.item("proportional-right").boundingBox();
    await grid.resize(separator, 30, 0);
    const sourceAfter = await grid.item("proportional-right").boundingBox();
    expect(sourceAfter?.width).not.toBeCloseTo(sourceBefore?.width ?? 0, 0);
  });

  test("native outside drop ends without changing the layout", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "basic" });
    const grid = new GridLayoutDriver(component, page);
    await component.evaluate(() => {
      const outsideTarget = document.createElement("div");
      outsideTarget.dataset.testid = "outside-drop-target";
      outsideTarget.style.cssText =
        "position:fixed;right:0;bottom:0;width:24px;height:24px;z-index:10000";
      document.body.append(outsideTarget);
    });

    await grid.header("beta").dragTo(page.getByTestId("outside-drop-target"), {
      targetPosition: { x: 12, y: 12 },
    });

    expect(await grid.gridArea("alpha")).toBe("1/1/2/2");
    expect(await grid.gridArea("beta")).toBe("1/2/2/3");
    await expect(component.locator('[class*="vuuDropTarget-"]')).toHaveCount(0);
    await expect(grid.item("beta")).not.toHaveClass(
      /vuuGridLayoutItem-dragging/,
    );
    await page.getByTestId("outside-drop-target").evaluate((element) => {
      element.remove();
    });
  });

  for (const [direction, sourceId, selected] of [
    ["north", "alpha", true],
    ["south", "beta", false],
    ["east", "alpha", true],
    ["west", "beta", false],
  ] as const) {
    test(`native ${selected ? "selected" : "nonselected"} stack member detaches ${direction}`, async ({
      mount,
      page,
    }) => {
      const component = await mount(fixture, { variant: "stacked-target" });
      const grid = new GridLayoutDriver(component, page);

      await grid.nativeTabDragToGrid(
        grid.tabItem(sourceId),
        grid.content("target"),
        direction,
      );

      await expect(component.getByRole("tablist")).toHaveCount(0);
      await expect(grid.item(sourceId)).toBeVisible();
      await expect(
        grid.item(sourceId === "alpha" ? "beta" : "alpha"),
      ).toBeVisible();
      const source = await grid.item(sourceId).boundingBox();
      const target = await grid.item("target").boundingBox();
      if (direction === "north") {
        expect(source?.y).toBeLessThan(target?.y ?? 0);
      } else if (direction === "south") {
        expect(source?.y).toBeGreaterThan(target?.y ?? 0);
      } else if (direction === "east") {
        expect(source?.x).toBeGreaterThan(target?.x ?? 0);
      } else {
        expect(source?.x).toBeLessThan(target?.x ?? 0);
      }
      await expect(component.locator('[class*="vuuDropTarget-"]')).toHaveCount(
        0,
      );

      if (direction === "east") {
        const separator = grid.separator().last();
        await expect(separator).toBeVisible();
        const targetBeforeResize = await grid.item("target").boundingBox();
        await grid.resize(separator, 30);
        const targetAfter = await grid.item("target").boundingBox();
        expect(targetAfter?.width).not.toBeCloseTo(
          targetBeforeResize?.width ?? 0,
          0,
        );
      }
    });
  }

  test("native stack member detach is rejected across grid scopes", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "stacked-cross-grid" });
    const grid = new GridLayoutDriver(component, page);
    const source = grid.tabItem("nested-alpha");
    const targetBox = await grid.item("parent-target").boundingBox();
    if (!targetBox) {
      throw Error("Cross-grid detach fixture is not visible");
    }

    await source.dragTo(grid.item("parent-target"), {
      targetPosition: {
        x: targetBox.width / 2,
        y: targetBox.height * 0.1,
      },
    });

    await expect(component.getByRole("tablist")).toBeVisible();
    await expect(grid.tabItem("nested-alpha")).toBeVisible();
    await expect(grid.item("parent-target")).toBeVisible();
    await expect(component.locator('[class*="vuuDropTarget-"]')).toHaveCount(0);
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

    await grid.drag(
      grid.header("rerender-alpha"),
      grid.content("rerender-beta"),
      "north",
    );
    const alphaArea = await grid.gridArea("rerender-alpha");
    const betaArea = await grid.gridArea("rerender-beta");
    const alpha = await grid.item("rerender-alpha").boundingBox();
    const beta = await grid.item("rerender-beta").boundingBox();
    expect(alpha?.y).toBeLessThan(beta?.y ?? 0);

    await grid.resize(grid.separator("horizontal"), 0, 40);

    expect(await grid.gridArea("rerender-alpha")).toBe(alphaArea);
    expect(await grid.gridArea("rerender-beta")).toBe(betaArea);
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

    const accepted = await grid.attemptRejectedDrag(
      grid.header("movable"),
      grid.content("locked"),
      "east",
    );

    expect(accepted).toBe(false);
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
    const stackId = await stack.getAttribute("id");
    if (!stackId) {
      throw Error("Palette-created stack has no id");
    }
    const separator = grid.separator("horizontal");
    await expect(separator).toHaveAttribute(
      "data-resized-child-items-before",
      "palette-target",
    );
    await expect(separator).toHaveAttribute(
      "data-resized-child-items-after",
      stackId,
    );
    await expect(separator).toHaveAttribute("aria-controls", stackId);
    await expect(component.locator(`[id="${stackId}"]`)).toHaveCount(1);
    const targetBefore = await grid.item("palette-target").boundingBox();
    const stackBefore = await stack.boundingBox();
    await grid.resize(separator, 0, 40);
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

  test("palette template drops onto an empty canonical placeholder", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "palette" });
    const grid = new GridLayoutDriver(component, page);
    const placeholder = grid.placeholder();
    const placeholderArea = await placeholder.evaluate(
      (element) => getComputedStyle(element).gridArea,
    );
    await grid.nativeDrag(
      component.getByTestId("palette-item-1"),
      placeholder,
      "centre",
    );

    await expect(placeholder).toHaveCount(0);
    const template = component
      .locator(".vuuGridLayoutItemHeader-title", { hasText: /^Template A$/ })
      .locator("xpath=../..");
    await expect(template).toBeVisible();
    await expect(template).toHaveCSS("grid-area", placeholderArea);
    await expect(component.getByTestId("template-content")).toHaveText(
      "Template A",
    );
  });

  test("cancelled palette placeholder preview cleans provisional content", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "palette" });
    const grid = new GridLayoutDriver(component, page);
    const source = component.getByTestId("palette-item-1");
    const placeholder = grid.placeholder();
    const sourceBox = await source.boundingBox();
    const targetBox = await placeholder.boundingBox();
    if (!sourceBox || !targetBox) {
      throw Error("Placeholder cancellation fixture is not visible");
    }
    await page.mouse.move(
      sourceBox.x + sourceBox.width / 2,
      sourceBox.y + sourceBox.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
      targetBox.x + targetBox.width / 2,
      targetBox.y + targetBox.height / 2,
      { steps: 20 },
    );
    await expect(placeholder).toHaveClass(/vuuDropTarget-centre/);
    await page.keyboard.press("Escape");
    await page.mouse.up();

    await expect(grid.placeholder()).toHaveCount(1);
    await expect(component.getByTestId("template-content")).toHaveCount(0);
    await expect(component.locator('[class*="vuuDropTarget-"]')).toHaveCount(0);
  });

  for (const [name, sourceId, targetId, placement, expected, selectedId] of [
    [
      "first to last",
      "alpha",
      "gamma",
      "after",
      ["beta", "gamma", "alpha"],
      "alpha",
    ],
    [
      "last to first",
      "gamma",
      "alpha",
      "before",
      ["gamma", "alpha", "beta"],
      "alpha",
    ],
    [
      "middle to last",
      "beta",
      "gamma",
      "after",
      ["alpha", "gamma", "beta"],
      "alpha",
    ],
  ] as const) {
    test(`native tab reorder moves ${name}`, async ({ mount, page }) => {
      const component = await mount(fixture, { variant: "stacked-three" });
      const grid = new GridLayoutDriver(component, page);

      await grid.nativeTabDrag(
        grid.tabItem(sourceId),
        grid.tabItem(targetId),
        placement,
      );

      await expect
        .poll(() =>
          component
            .locator(".vuuDraggableItem")
            .evaluateAll((items) =>
              items
                .toSorted(
                  (left, right) =>
                    left.getBoundingClientRect().left -
                    right.getBoundingClientRect().left,
                )
                .map((item) => item.getAttribute("data-grid-layout-item-id")),
            ),
        )
        .toEqual(expected);
      await expect(grid.tabItem(selectedId).getByRole("tab")).toHaveAttribute(
        "aria-selected",
        "true",
      );
    });
  }

  test("native tab reorder no-op and cancel preserve order and selection", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "stacked-three" });
    const grid = new GridLayoutDriver(component, page);

    await grid.nativeTabDrag(
      grid.tabItem("alpha"),
      grid.tabItem("alpha"),
      "before",
    );
    await grid.cancelNativeTabDrag(
      grid.tabItem("alpha"),
      grid.tabItem("gamma"),
      "after",
    );

    await expect
      .poll(() =>
        component
          .locator(".vuuDraggableItem")
          .evaluateAll((items) =>
            items
              .toSorted(
                (left, right) =>
                  left.getBoundingClientRect().left -
                  right.getBoundingClientRect().left,
              )
              .map((item) => item.getAttribute("data-grid-layout-item-id")),
          ),
      )
      .toEqual(["alpha", "beta", "gamma"]);
    await expect(grid.tabItem("alpha").getByRole("tab")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(component.locator(".SpaceMan")).toHaveCount(0);
  });

  test("dragging duplicate-title tabs preserves item identity", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "stacked-duplicates" });
    const grid = new GridLayoutDriver(component, page);

    await grid.nativeTabDrag(
      grid.tabItem("beta"),
      grid.tabItem("alpha"),
      "before",
    );

    await expect
      .poll(() =>
        component
          .locator(".vuuDraggableItem")
          .evaluateAll((items) =>
            items
              .toSorted(
                (left, right) =>
                  left.getBoundingClientRect().left -
                  right.getBoundingClientRect().left,
              )
              .map((item) => item.getAttribute("data-grid-layout-item-id")),
          ),
      )
      .toEqual(["beta", "alpha", "gamma"]);
    await expect(grid.tabItem("alpha").getByRole("tab")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});
