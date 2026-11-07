import type { Page } from "@playwright/test";
import { expect, test } from "../../../../../playwright/fixtures";
import type { GridLayoutDocument } from "../../GridLayoutDocument";
import { GridLayoutDriver } from "./GridLayoutDriver";

const documentFixture =
  "GridLayout/GridLayoutDocumentFixture/GridLayoutDocumentFixture";
const testFixture = "GridLayout/GridLayoutTestFixture/GridLayoutTestFixture";

const lastWrite = (page: Page) =>
  page.evaluate(() => window.gridTest.writes.at(-1));

const itemIdsOf = (document: GridLayoutDocument | undefined) =>
  document?.layout.items.map(({ id }) => id) ?? [];

const componentIdsOf = (document: GridLayoutDocument | undefined) =>
  document?.components.map(({ id }) => id) ?? [];

const closeButton = (page: Page, id: string) =>
  page
    .locator(`[id="${id}"]`)
    .locator(":scope > .vuuGridLayoutItemHeader")
    .getByRole("button", { exact: true, name: "Close" });

test.describe("GridLayout undo and redo", () => {
  test("Undo restores a closed item with its settings, Redo closes it again", async ({
    mount,
    page,
  }) => {
    const component = await mount(documentFixture, { variant: "history" });
    const grid = new GridLayoutDriver(component, page);
    const undo = page.getByRole("button", { exact: true, name: "Undo" });
    const redo = page.getByRole("button", { exact: true, name: "Redo" });
    await expect(undo).toBeDisabled();
    await expect(redo).toBeDisabled();

    await grid.item("solo").locator(".vuuGridLayoutItemHeader-close").click();
    await expect(grid.item("solo")).toHaveCount(0);
    await expect(undo).toBeEnabled();

    await undo.click();
    await expect(component.locator("[data-label='Solo']")).toBeVisible();
    await expect(undo).toBeDisabled();
    await expect(redo).toBeEnabled();
    const undone = await lastWrite(page);
    expect(undone?.kind).toBe("undo");
    expect(itemIdsOf(undone?.document)).toContain("solo");
    expect(componentIdsOf(undone?.document)).toContain("component-solo");

    await redo.click();
    await expect(grid.item("solo")).toHaveCount(0);
    const redone = await lastWrite(page);
    expect(redone).toMatchObject({
      kind: "redo",
      removedComponentInstanceIds: ["component-solo"],
    });
    expect(itemIdsOf(redone?.document)).not.toContain("solo");

    await undo.click();
    await expect(component.locator("[data-label='Solo']")).toBeVisible();
    expect(componentIdsOf((await lastWrite(page))?.document)).toContain(
      "component-solo",
    );
  });

  test("Undo restores a closed stack member", async ({ mount, page }) => {
    const component = await mount(documentFixture, { variant: "history" });
    const grid = new GridLayoutDriver(component, page);
    await expect(grid.tabItem("tab-b")).toBeVisible();

    await page.evaluate(() =>
      window.gridTest.controllers["history-grid"].dispatch({
        itemId: "tab-b",
        reason: "close",
        type: "remove-item",
      }),
    );
    await expect(grid.tabItem("tab-b")).toHaveCount(0);

    await page.getByRole("button", { exact: true, name: "Undo" }).click();
    await expect(grid.tabItem("tab-b")).toBeVisible();
    const write = await lastWrite(page);
    expect(
      write?.document.layout.stacks.find(({ id }) => id === "stack-1")?.itemIds,
    ).toEqual(["tab-a", "tab-b"]);
    expect(componentIdsOf(write?.document)).toContain("component-tab-b");
  });

  test("Undo reverts a drag into a stack as one step", async ({
    mount,
    page,
  }) => {
    const component = await mount(documentFixture, { variant: "history" });
    await expect(component.locator("[data-label='Solo']")).toBeVisible();

    const result = await page.evaluate(() =>
      window.gridTest.coordinatorDrag(
        "history-grid",
        { itemId: "solo", kind: "existing-item", sourceGridId: "history-grid" },
        {
          intent: { kind: "stack", position: "before", targetItemId: "tab-a" },
          targetId: "stack-1",
        },
      ),
    );
    expect(result.commit).toBe(true);
    const dragged = await lastWrite(page);
    expect(itemIdsOf(dragged?.document)).toContain("solo");
    expect(dragged?.document.layout.stacks[0]?.itemIds).toContain("solo");

    await page.getByRole("button", { exact: true, name: "Undo" }).click();
    const undone = await lastWrite(page);
    expect(undone?.kind).toBe("undo");
    expect(undone?.document.layout.stacks[0]?.itemIds).toEqual([
      "tab-a",
      "tab-b",
    ]);
    expect(
      undone?.document.layout.items.find(({ id }) => id === "solo")?.column,
    ).toEqual({ span: 1, start: 1 });
    await expect(component.locator("[data-label='Solo']")).toBeVisible();
    await expect(
      page.getByRole("button", { exact: true, name: "Undo" }),
    ).toBeDisabled();
  });

  test("Undo removes an inserted template, Redo restores it with its settings", async ({
    mount,
    page,
  }) => {
    const component = await mount(documentFixture, { variant: "history" });
    await expect(component.locator("[data-label='Solo']")).toBeVisible();
    const itemId = await page.evaluate(() =>
      window.gridTest.commands?.insertTemplate(
        {
          component: { settings: { label: "New" }, type: "label", version: 1 },
          label: "New",
        },
        { kind: "split", position: "east", targetId: "solo" },
      ),
    );
    await expect(component.locator("[data-label='New']")).toHaveCount(1);
    const inserted = await lastWrite(page);
    const componentId = inserted?.document.layout.items.find(
      ({ id }) => id === itemId,
    )?.componentInstanceId;

    await page.getByRole("button", { exact: true, name: "Undo" }).click();
    await expect(component.locator("[data-label='New']")).toHaveCount(0);
    expect(itemIdsOf((await lastWrite(page))?.document)).not.toContain(itemId);

    await page.getByRole("button", { exact: true, name: "Redo" }).click();
    await expect(component.locator("[data-label='New']")).toHaveCount(1);
    const redone = await lastWrite(page);
    expect(itemIdsOf(redone?.document)).toContain(itemId);
    expect(
      redone?.document.components.find(
        ({ id }) => id === (componentId ?? itemId),
      )?.settings,
    ).toEqual({ label: "New" });
  });

  test("selecting a tab is not an undo step", async ({ mount, page }) => {
    await mount(documentFixture, { variant: "history" });
    await page.getByRole("tab", { name: "Tab b" }).click();
    await expect(page.getByRole("tab", { name: "Tab b" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(
      page.getByRole("button", { exact: true, name: "Undo" }),
    ).toBeDisabled();
  });

  test("Ctrl+Z and Ctrl+Shift+Z undo and redo changes in nested grids, newest first", async ({
    mount,
    page,
  }) => {
    const component = await mount(testFixture, { variant: "undo-nested" });
    const grid = new GridLayoutDriver(component, page);
    const innerButton = page.getByRole("button", { name: "Inner A" });

    await closeButton(page, "inner-b").click();
    await expect(grid.item("inner-b")).toHaveCount(0);
    await closeButton(page, "outer-a").click();
    await expect(grid.item("outer-a")).toHaveCount(0);

    await innerButton.focus();
    await page.keyboard.press("ControlOrMeta+z");
    await expect(grid.item("outer-a")).toBeVisible();
    await expect(grid.item("inner-b")).toHaveCount(0);

    await innerButton.focus();
    await page.keyboard.press("ControlOrMeta+z");
    await expect(grid.item("inner-b")).toBeVisible();
    await expect(
      page.getByRole("button", { exact: true, name: "Undo" }),
    ).toBeDisabled();

    await innerButton.focus();
    await page.keyboard.press("ControlOrMeta+Shift+z");
    await expect(grid.item("inner-b")).toHaveCount(0);
    await expect(grid.item("outer-a")).toBeVisible();
  });

  test("Ctrl+Z in a text input is left to the input", async ({
    mount,
    page,
  }) => {
    const component = await mount(testFixture, { variant: "undo-nested" });
    const grid = new GridLayoutDriver(component, page);
    await closeButton(page, "inner-b").click();
    await expect(grid.item("inner-b")).toHaveCount(0);

    const input = page.getByRole("textbox", { name: "Notes" });
    await input.fill("typed");
    await input.press("ControlOrMeta+z");
    await expect(grid.item("inner-b")).toHaveCount(0);
    await expect(
      page.getByRole("button", { exact: true, name: "Undo" }),
    ).toBeEnabled();
  });

  test("repeated keyboard resizes of one splitter are one undo step", async ({
    mount,
    page,
  }) => {
    const component = await mount(testFixture, { variant: "resizable" });
    const grid = new GridLayoutDriver(component, page);
    const width = async () =>
      (await grid.item("fixed").boundingBox())?.width ?? 0;
    const before = await width();

    await grid.separator().focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    expect(await width()).toBeCloseTo(before + 30, 0);

    await page.keyboard.press("ControlOrMeta+z");
    await expect.poll(width).toBeCloseTo(before, 0);

    await page.keyboard.press("ControlOrMeta+Shift+z");
    await expect.poll(width).toBeCloseTo(before + 30, 0);
  });
});
