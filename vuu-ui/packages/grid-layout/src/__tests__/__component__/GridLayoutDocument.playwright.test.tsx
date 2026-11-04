import type { Locator, Page } from "@playwright/test";
import { expect, test } from "../../../../../playwright/fixtures";
import type { GridLayoutDocument } from "../../GridLayoutDocument";
import { GridLayoutDriver } from "./GridLayoutDriver";

const fixture =
  "GridLayout/GridLayoutDocumentFixture/GridLayoutDocumentFixture";

/* Fixture documents, built here because fixture modules are not loaded in Node */

const labelDocument = (
  gridId: string,
  componentId: string,
  label: string,
  version = 1,
): GridLayoutDocument => ({
  components: [
    { id: componentId, settings: { label }, type: "label", version },
  ],
  kind: "grid-layout",
  layout: {
    columns: ["300px"],
    id: gridId,
    items: [
      {
        column: { span: 1, start: 1 },
        id: componentId,
        row: { span: 1, start: 1 },
      },
    ],
    placeholderIds: [],
    rows: ["300px"],
    stacks: [],
  },
  version: 2,
});

const typedTemplate = (label: string) => ({
  component: { settings: { label }, type: "label", version: 1 },
  label,
});

const writeCount = (page: Page) =>
  page.evaluate(() => window.gridTest.writes.length);

const lastWrite = (page: Page) =>
  page.evaluate(() => window.gridTest.writes.at(-1));

const labels = (root: Locator) =>
  root
    .locator("[data-label]")
    .evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("data-label")),
    );

const stackOf = (document: GridLayoutDocument | undefined, id = "stack-1") =>
  document?.layout.stacks.find((stack) => stack.id === id);

const itemIdsOf = (document: GridLayoutDocument | undefined) =>
  document?.layout.items.map(({ id }) => id) ?? [];

test.describe("useGridLayoutCommands", () => {
  test("is undefined outside a GridLayoutProvider", async ({ mount, page }) => {
    await mount(fixture, { variant: "commands-outside-provider" });
    expect(await page.evaluate(() => window.gridTest.commands)).toBeUndefined();
  });

  test("reports content items", async ({ mount, page }) => {
    await mount(fixture, { variant: "commands" });
    expect(
      await page.evaluate(() => {
        const commands = window.gridTest.commands;
        return {
          contentItemIds: commands?.getContentItemIds(),
          gridId: commands?.gridId,
          placeholderIds: commands?.getPlaceholderIds(),
        };
      }),
    ).toEqual({
      contentItemIds: ["solo", "tab-a", "tab-b"],
      gridId: "commands-grid",
      placeholderIds: [],
    });
  });

  test("reports placeholder items", async ({ mount, page }) => {
    await mount(fixture, { variant: "commands-empty" });
    await expect
      .poll(() => page.evaluate(() => !!window.gridTest.commands))
      .toBe(true);
    expect(
      await page.evaluate(() => window.gridTest.commands?.getPlaceholderIds()),
    ).toEqual(["placeholder-1"]);
  });

  test("fills a placeholder", async ({ mount, page }) => {
    const component = await mount(fixture, { variant: "commands-empty" });
    const itemId = await page.evaluate(
      (template) =>
        window.gridTest.commands?.insertTemplate(template, {
          kind: "replace",
          targetId: "placeholder-1",
        }),
      typedTemplate("New"),
    );
    await expect(component.locator("[data-label]")).toHaveCount(1);
    expect(await labels(component)).toEqual(["New"]);
    expect(
      await page.evaluate(() => {
        const commands = window.gridTest.commands;
        return {
          contentItemIds: commands?.getContentItemIds(),
          placeholderIds: commands?.getPlaceholderIds(),
        };
      }),
    ).toEqual({ contentItemIds: [itemId], placeholderIds: [] });
    expect((await lastWrite(page))?.document.components).toHaveLength(1);
  });

  test("replaces the content of a standalone item", async ({ mount, page }) => {
    const component = await mount(fixture, { variant: "commands" });
    const itemId = await page.evaluate(
      (template) =>
        window.gridTest.commands?.insertTemplate(template, {
          kind: "replace",
          targetId: "solo",
        }),
      typedTemplate("New"),
    );
    await expect(component.locator("[data-label='New']")).toHaveCount(1);
    expect(await labels(component)).not.toContain("Solo");
    const contentItemIds = await page.evaluate(() =>
      window.gridTest.commands?.getContentItemIds(),
    );
    expect(contentItemIds).toContain(itemId);
    expect(contentItemIds).not.toContain("solo");
  });

  test("replaces a stack member in place", async ({ mount, page }) => {
    await mount(fixture, { variant: "commands" });
    const itemId = await page.evaluate(
      (template) =>
        window.gridTest.commands?.insertTemplate(template, {
          kind: "replace",
          targetId: "tab-a",
        }),
      typedTemplate("New"),
    );
    await expect
      .poll(async () => stackOf((await lastWrite(page))?.document))
      .toMatchObject({
        itemIds: [itemId, "tab-b"],
        selectedItemId: itemId,
      });
    expect(
      await page.evaluate(() => window.gridTest.commands?.getContentItemIds()),
    ).not.toContain("tab-a");
  });

  test("splits the target", async ({ mount, page }) => {
    const component = await mount(fixture, { variant: "commands" });
    const itemId = await page.evaluate(
      (template) =>
        window.gridTest.commands?.insertTemplate(template, {
          kind: "split",
          position: "east",
          targetId: "solo",
        }),
      typedTemplate("New"),
    );
    await expect(component.locator("[data-label='New']")).toHaveCount(1);
    const items = (await lastWrite(page))?.document.layout.items ?? [];
    const solo = items.find(({ id }) => id === "solo");
    const inserted = items.find(({ id }) => id === itemId);
    expect(solo).toBeDefined();
    expect(inserted?.column.start).toBeGreaterThan(solo?.column.start ?? 0);
  });

  test("stacks with a standalone item", async ({ mount, page }) => {
    await mount(fixture, { variant: "commands" });
    const itemId = await page.evaluate(
      (template) =>
        window.gridTest.commands?.insertTemplate(template, {
          kind: "stack",
          targetId: "solo",
        }),
      typedTemplate("New"),
    );
    await expect.poll(() => writeCount(page)).toBe(1);
    const stack = (await lastWrite(page))?.document.layout.stacks.find(
      ({ itemIds }) => itemIds.includes("solo"),
    );
    expect(stack).toMatchObject({
      itemIds: ["solo", itemId],
      selectedItemId: itemId,
    });
  });

  test("stacks after a stack member, selecting the new tab", async ({
    mount,
    page,
  }) => {
    await mount(fixture, { variant: "commands" });
    const itemId = await page.evaluate(
      (template) =>
        window.gridTest.commands?.insertTemplate(template, {
          kind: "stack",
          targetId: "tab-a",
        }),
      typedTemplate("New"),
    );
    await expect.poll(() => writeCount(page)).toBe(1);
    expect(stackOf((await lastWrite(page))?.document)).toMatchObject({
      itemIds: ["tab-a", itemId, "tab-b"],
      selectedItemId: itemId,
    });
  });

  test("inserts repeatedly", async ({ mount, page }) => {
    const component = await mount(fixture, { variant: "commands" });
    const [first, second] = await page.evaluate(
      ([firstTemplate, secondTemplate]) => {
        const commands = window.gridTest.commands;
        const firstId = commands?.insertTemplate(firstTemplate, {
          kind: "split",
          position: "east",
          targetId: "solo",
        });
        const secondId = commands?.insertTemplate(secondTemplate, {
          kind: "split",
          position: "south",
          targetId: firstId ?? "",
        });
        return [firstId, secondId];
      },
      [typedTemplate("First"), typedTemplate("Second")],
    );
    await expect(component.locator("[data-label='Second']")).toHaveCount(1);
    expect(await labels(component)).toEqual(
      expect.arrayContaining(["First", "Second"]),
    );
    expect(
      await page.evaluate(() => window.gridTest.commands?.getContentItemIds()),
    ).toEqual(expect.arrayContaining([first, second]));
  });

  test("throws for an unknown target", async ({ mount, page }) => {
    await mount(fixture, { variant: "commands" });
    const message = await page.evaluate((template) => {
      try {
        window.gridTest.commands?.insertTemplate(template, {
          kind: "replace",
          targetId: "missing",
        });
        return "";
      } catch (error) {
        return String(error);
      }
    }, typedTemplate("New"));
    expect(message).toMatch(/not found/);
  });

  test("notifies subscribers of changes", async ({ mount, page }) => {
    await mount(fixture, { variant: "commands-empty" });
    const notified = await page.evaluate((template) => {
      const commands = window.gridTest.commands;
      let count = 0;
      const unsubscribe = commands?.subscribe(() => {
        count += 1;
      });
      commands?.insertTemplate(template, {
        kind: "replace",
        targetId: "placeholder-1",
      });
      unsubscribe?.();
      return count;
    }, typedTemplate("New"));
    expect(notified).toBeGreaterThan(0);
  });
});

test.describe("GridLayoutProvider onDocumentChange from the UI", () => {
  test("fires when an item is closed from its header close button", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "document-change" });
    const grid = new GridLayoutDriver(component, page);
    await expect(grid.item("solo")).toBeVisible();
    expect(await writeCount(page)).toBe(0);

    await grid.item("solo").locator(".vuuGridLayoutItemHeader-close").click();

    await expect(grid.item("solo")).toHaveCount(0);
    expect(await writeCount(page)).toBe(1);
    const write = await lastWrite(page);
    expect(write).toMatchObject({
      kind: "dispatch",
      removedComponentInstanceIds: ["component-solo"],
      sameDocument: true,
    });
    expect(itemIdsOf(write?.document)).not.toContain("solo");
  });

  test("fires when a stack member is closed", async ({ mount, page }) => {
    const component = await mount(fixture, { variant: "document-change" });
    const grid = new GridLayoutDriver(component, page);

    await expect(grid.tabItem("tab-b")).toBeVisible();

    await page.evaluate(() =>
      window.gridTest.controllers["change-grid"].dispatch({
        itemId: "tab-b",
        reason: "close",
        type: "remove-item",
      }),
    );

    await expect(grid.tabItem("tab-b")).toHaveCount(0);
    expect(await writeCount(page)).toBe(1);
    const write = await lastWrite(page);
    expect(write).toMatchObject({
      kind: "dispatch",
      removedComponentInstanceIds: ["component-tab-b"],
    });
    expect(stackOf(write?.document)?.itemIds).toEqual(["tab-a", "tab-c"]);
  });

  test("fires when a tab is selected in a stack", async ({ mount, page }) => {
    const component = await mount(fixture, { variant: "document-change" });
    const tab = component.getByRole("tab", { name: "Tab c", exact: true });

    await tab.click();

    await expect(tab).toHaveAttribute("aria-selected", "true");
    expect(await writeCount(page)).toBe(1);
    const write = await lastWrite(page);
    expect(write).toMatchObject({
      kind: "dispatch",
      removedComponentInstanceIds: [],
    });
    expect(stackOf(write?.document)).toMatchObject({
      itemIds: ["tab-a", "tab-b", "tab-c"],
      selectedItemId: "tab-c",
    });
  });

  test("fires when stack tabs are reordered", async ({ mount, page }) => {
    const component = await mount(fixture, { variant: "document-change" });
    const grid = new GridLayoutDriver(component, page);

    await grid.nativeTabDrag(
      grid.tabItem("tab-a"),
      grid.tabItem("tab-c"),
      "after",
    );

    await expect.poll(() => writeCount(page)).toBe(1);
    const write = await lastWrite(page);
    expect(write).toMatchObject({
      kind: "drag",
      removedComponentInstanceIds: [],
    });
    expect(stackOf(write?.document)).toMatchObject({
      itemIds: ["tab-b", "tab-c", "tab-a"],
      selectedItemId: "tab-a",
    });
  });

  test("fires once, on commit, when an item is moved into a stack", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "document-change" });
    await expect(
      new GridLayoutDriver(component, page).item("solo"),
    ).toBeVisible();

    const result = await page.evaluate(() =>
      window.gridTest.coordinatorDrag(
        "change-grid",
        { itemId: "solo", kind: "existing-item", sourceGridId: "change-grid" },
        {
          intent: { kind: "stack", position: "before", targetItemId: "tab-a" },
          targetId: "stack-1",
        },
      ),
    );

    expect(result).toEqual({
      begin: true,
      commit: true,
      preview: true,
      writesBeforeCommit: 0,
    });
    expect(await writeCount(page)).toBe(1);
    const write = await lastWrite(page);
    expect(write).toMatchObject({
      kind: "drag",
      removedComponentInstanceIds: [],
    });
    expect(stackOf(write?.document)?.itemIds).toEqual([
      "solo",
      "tab-a",
      "tab-b",
      "tab-c",
    ]);
  });

  test("fires when an item is dragged out of a stack", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "document-change" });
    const grid = new GridLayoutDriver(component, page);

    await grid.nativeTabDragToGrid(
      grid.tabItem("tab-b"),
      grid.content("solo"),
      "south",
    );

    await expect.poll(() => writeCount(page)).toBe(1);
    const write = await lastWrite(page);
    expect(write).toMatchObject({
      kind: "drag",
      removedComponentInstanceIds: [],
    });
    expect(stackOf(write?.document)?.itemIds).toEqual(["tab-a", "tab-c"]);
    expect(itemIdsOf(write?.document)).toContain("tab-b");
  });
});

test.describe("GridLayoutProvider persistence", () => {
  test("writes only committed transitions", async ({ mount, page }) => {
    const component = await mount(fixture, { variant: "persistence-children" });
    await expect(
      new GridLayoutDriver(component, page).item("left"),
    ).toBeVisible();
    expect(await writeCount(page)).toBe(0);

    await page.evaluate(() =>
      window.gridTest.controllers["persisted-grid"].dispatch({
        itemId: "left",
        title: "Renamed",
        type: "rename-item",
      }),
    );
    expect(await writeCount(page)).toBe(1);

    await page.evaluate(() => {
      const result =
        window.gridTest.controllers["persisted-grid"].beginTransaction(
          "resize",
        );
      if (!result.ok) {
        throw Error(result.error.message);
      }
      result.transaction.dispatch({
        index: 0,
        size: "120px",
        track: "column",
        type: "resize-track",
      });
      window.gridTest.saved.writesDuringPreview = window.gridTest.writes.length;
      result.transaction.rollback();
    });
    expect(
      await page.evaluate(() => window.gridTest.saved.writesDuringPreview),
    ).toBe(1);
    expect(await writeCount(page)).toBe(1);

    await page.evaluate(() => {
      const result =
        window.gridTest.controllers["persisted-grid"].beginTransaction(
          "resize",
        );
      if (!result.ok) {
        throw Error(result.error.message);
      }
      result.transaction.dispatch({
        index: 0,
        size: "125px",
        track: "column",
        type: "resize-track",
      });
      result.transaction.commit();
    });
    expect(await writeCount(page)).toBe(2);
  });

  test("publishes committed revisions and removed component instance ids", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "persistence-document" });
    await expect(component.locator("[data-label='Alpha']")).toBeVisible();

    const result = await page.evaluate(() => {
      const { controllers, documentController } = window.gridTest;
      let notified = 0;
      documentController?.subscribe(() => {
        notified += 1;
      });
      controllers["interactive-grid"].dispatch({
        itemId: "item-alpha",
        reason: "close",
        type: "remove-item",
      });
      return {
        notified,
        removed: documentController?.getChange()?.removedComponentInstanceIds,
        snapshotIsLastDocument:
          documentController?.getSnapshot() === window.gridTest.lastDocument,
      };
    });

    expect(result).toEqual({
      notified: 1,
      removed: ["component-alpha"],
      snapshotIsLastDocument: true,
    });
    expect(await writeCount(page)).toBe(1);
    expect(await lastWrite(page)).toMatchObject({
      kind: "dispatch",
      removedComponentInstanceIds: ["component-alpha"],
      revision: 1,
    });
  });

  test("loads and replaces typed content without a write", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "load-replace" });
    const grid = new GridLayoutDriver(component, page);
    await expect(grid.item("a")).toHaveText("A");

    await page.evaluate(
      (document) => window.gridTest.setDocument?.(document),
      labelDocument("loaded-grid", "b", "B"),
    );

    await expect(grid.item("b")).toHaveText("B");
    await expect(grid.item("a")).toHaveCount(0);
    expect(await writeCount(page)).toBe(0);
  });

  test("saves, reconstructs, and continues with stable item and component ids", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "persistence-document" });
    await expect(component.locator("[data-label='Alpha']")).toBeVisible();

    await page.evaluate(() =>
      window.gridTest.controllers["interactive-grid"].dispatch({
        index: 0,
        size: "125px",
        track: "column",
        type: "resize-track",
      }),
    );
    expect(await writeCount(page)).toBe(1);
    const saved = (await lastWrite(page))?.document;
    expect(saved?.layout.items[0]).toMatchObject({
      componentInstanceId: "component-alpha",
      id: "item-alpha",
    });
    expect(JSON.stringify(saved)).not.toMatch(
      /react|function|componentJson|props/,
    );

    // load a different layout, then the saved one, so the grid is rebuilt
    await page.evaluate(
      (document) => window.gridTest.setDocument?.(document),
      labelDocument("interactive-grid", "other", "Other"),
    );
    await expect(component.locator("[data-label='Other']")).toBeVisible();
    await page.evaluate((document) => {
      window.gridTest.writes = [];
      window.gridTest.setDocument?.(document);
    }, saved);
    await expect(
      component.locator('[data-component-id="component-alpha"]'),
    ).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() =>
          window.gridTest.controllers["interactive-grid"]
            ?.getSnapshot()
            .columns.map(({ size }) => size),
        ),
      )
      .toEqual(["125px", "200px"]);
    expect(await writeCount(page)).toBe(0);

    await page.evaluate(() =>
      window.gridTest.controllers["interactive-grid"].dispatch({
        itemId: "item-beta",
        selectedItemId: "item-beta",
        targetId: "item-alpha",
        type: "create-stack",
      }),
    );
    expect(await writeCount(page)).toBe(1);
    expect((await lastWrite(page))?.document).toMatchObject({
      kind: "grid-layout",
      layout: {
        columns: ["125px", "200px"],
        stacks: [
          {
            itemIds: ["item-alpha", "item-beta"],
            selectedItemId: "item-beta",
          },
        ],
      },
      version: 2,
    });
  });

  test("keeps the active layout when a document cannot decode or render", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "load-replace" });
    const grid = new GridLayoutDriver(component, page);
    const active = labelDocument("loaded-grid", "active", "Active");
    await page.evaluate(
      (document) => window.gridTest.setDocument?.(document),
      active,
    );
    await expect(grid.item("active")).toHaveText("Active");

    await page.evaluate((document) => window.gridTest.setDocument?.(document), {
      ...active,
      components: [{ id: "active", settings: {}, type: "unknown", version: 1 }],
    });
    await expect
      .poll(() => page.evaluate(() => window.gridTest.errors))
      .toEqual(["COMPONENT_SETTINGS_ERROR"]);
    await expect(grid.item("active")).toHaveText("Active");

    await page.evaluate((document) => {
      window.gridTest.setDocument?.(document);
      window.gridTest.setRenderers?.("empty");
    }, active);
    await expect
      .poll(() => page.evaluate(() => window.gridTest.errors))
      .toEqual(["COMPONENT_SETTINGS_ERROR", "COMPONENT_RENDERER_ERROR"]);
    await expect(grid.item("active")).toHaveText("Active");
  });

  test("keeps the active layout when a settings migration fails", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "migration" });
    const grid = new GridLayoutDriver(component, page);
    await expect(grid.item("active")).toHaveText("Active");

    await page.evaluate((document) => window.gridTest.setDocument?.(document), {
      ...labelDocument("loaded-grid", "active", "Active", 2),
      components: [
        { id: "active", settings: { text: 42 }, type: "label", version: 1 },
      ],
    });

    await expect
      .poll(() => page.evaluate(() => window.gridTest.errors))
      .toEqual(["COMPONENT_SETTINGS_ERROR"]);
    await expect(grid.item("active")).toHaveText("Active");
  });

  test("reads a legacy serializedLayout but writes a v2 document", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, {
      variant: "legacy-serialized-layout",
    });
    await expect(component).toContainText("Legacy green");
    expect(await writeCount(page)).toBe(0);

    await component.locator(".vuuGridLayoutItemHeader-close").click();

    await expect.poll(() => writeCount(page)).toBe(1);
    expect((await lastWrite(page))?.document).toMatchObject({
      kind: "grid-layout",
      version: 2,
    });
  });
});

test.describe("useGridComponentSettingsUpdater", () => {
  test("publishes a settings change for the component", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "settings" });
    await expect(component.locator("[data-label='B']")).toBeVisible();

    expect(
      await page.evaluate(() =>
        window.gridTest.updater?.("component-b", { label: "B2" }),
      ),
    ).toBe(true);

    await expect.poll(() => writeCount(page)).toBe(1);
    const write = await lastWrite(page);
    expect(write).toMatchObject({
      kind: "settings",
      removedComponentInstanceIds: [],
    });
    expect(write?.document.components).toEqual([
      {
        id: "component-a",
        settings: { label: "A" },
        type: "label",
        version: 1,
      },
      {
        id: "component-b",
        settings: { label: "B2" },
        type: "label",
        version: 1,
      },
    ]);
    expect(
      await page.evaluate(
        () =>
          window.gridTest.documentController?.getSnapshot() ===
          window.gridTest.lastDocument,
      ),
    ).toBe(true);

    await page.evaluate(() =>
      window.gridTest.updater?.("component-a", { label: "A2" }),
    );
    await expect.poll(() => writeCount(page)).toBe(2);
    expect((await lastWrite(page))?.document.components).toEqual([
      {
        id: "component-a",
        settings: { label: "A2" },
        type: "label",
        version: 1,
      },
      {
        id: "component-b",
        settings: { label: "B2" },
        type: "label",
        version: 1,
      },
    ]);
  });

  test("rejects unknown components and invalid settings", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "settings" });
    await expect(component.locator("[data-label='A']")).toBeVisible();

    expect(
      await page.evaluate(() => [
        window.gridTest.updater?.("missing", { label: "x" }),
        window.gridTest.updater?.("component-a", { label: 42 }),
      ]),
    ).toEqual([false, false]);
    expect(await page.evaluate(() => window.gridTest.errors)).toHaveLength(1);
    expect(await writeCount(page)).toBe(0);
  });

  test("is a no-op outside a GridLayoutProvider", async ({ mount, page }) => {
    await mount(fixture, { variant: "settings-outside-provider" });
    expect(
      await page.evaluate(() =>
        window.gridTest.updater?.("component-a", { label: "x" }),
      ),
    ).toBe(false);
  });
});

test.describe("GridLayout drag cancellation", () => {
  test("keeps an HTML drag active through pointercancel", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "existing-item" });
    const grid = new GridLayoutDriver(component, page);
    const target = grid.content("target");

    await grid.startNativeDrag(grid.header("source"), target, "east");
    await expect(target).toHaveClass(/vuuDropTarget-east/);
    await page.evaluate(() => window.dispatchEvent(new Event("pointercancel")));
    await expect(target).toHaveClass(/vuuDropTarget-east/);

    await grid.finishNativeDrag();
    await expect(target).not.toHaveClass(/vuuDropTarget-east/);
  });

  test("does not restore drag styling when cancelled before the next frame", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "existing-item" });
    const grid = new GridLayoutDriver(component, page);
    await expect(grid.header("source")).toBeVisible();

    await grid.header("source").evaluate((source) => {
      source.dispatchEvent(
        new DragEvent("dragstart", {
          bubbles: true,
          cancelable: true,
          dataTransfer: new DataTransfer(),
        }),
      );
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    // let any frame scheduled by dragstart run
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );

    await expect(grid.item("source")).not.toHaveClass(
      /vuuGridLayoutItem-dragging/,
    );
    await expect(grid.layout("drag-grid")).not.toHaveClass(/vuuDragging/);
  });
});

test.describe("useTemplateDragState", () => {
  test("is shared outside the grid, steady during pointer moves, and cleared on drop", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "template-drag-state" });
    const grid = new GridLayoutDriver(component, page);
    const shellState = component.getByTestId("drag-state-shell");
    const target = grid.content("workspace-target");
    await expect(shellState).toHaveAttribute("data-dragging", "false");
    expect(
      await page.evaluate(() => [
        window.gridTest.shellDragStates.at(-1),
        window.gridTest.nestedDragStates.at(-1),
      ]),
    ).toEqual([{ dragging: false }, { dragging: false }]);

    await grid.startNativeDrag(
      component.getByTestId("typed-palette-item"),
      target,
      "west",
    );
    await expect(shellState).toHaveAttribute("data-dragging", "true");
    await expect(shellState).toHaveText("Typed template");
    expect(
      await page.evaluate(() => {
        const { nestedDragStates, shellDragStates } = window.gridTest;
        return {
          sameState: nestedDragStates.at(-1) === shellDragStates.at(-1),
          state: shellDragStates.at(-1),
        };
      }),
    ).toEqual({
      sameState: true,
      state: { dragging: true, template: typedTemplate("Typed template") },
    });

    const renderCounts = () =>
      page.evaluate(() => [
        window.gridTest.shellDragStates.length,
        window.gridTest.nestedDragStates.length,
      ]);
    const rendersDuringDrag = await renderCounts();
    const box = await target.boundingBox();
    if (!box) {
      throw Error("workspace target has no bounding box");
    }
    for (const fraction of [0.6, 0.7, 0.8, 0.9]) {
      await page.mouse.move(
        box.x + box.width * fraction,
        box.y + box.height / 2,
      );
    }
    await expect(target).toHaveClass(/vuuDropTarget-east/);
    expect(await renderCounts()).toEqual(rendersDuringDrag);
    expect(await writeCount(page)).toBe(0);

    await grid.finishNativeDrag();

    await expect(shellState).toHaveAttribute("data-dragging", "false");
    expect(
      await page.evaluate(() => [
        window.gridTest.shellDragStates.at(-1),
        window.gridTest.nestedDragStates.at(-1),
      ]),
    ).toEqual([{ dragging: false }, { dragging: false }]);
    await expect.poll(() => writeCount(page)).toBe(1);
    expect((await lastWrite(page))?.document.components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          settings: { label: "Typed template" },
          type: "label",
          version: 1,
        }),
      ]),
    );
  });

  test("is cleared when a template drag is cancelled", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "template-drag-state" });
    const grid = new GridLayoutDriver(component, page);
    const shellState = component.getByTestId("drag-state-shell");

    await grid.startNativeDrag(
      component.getByTestId("typed-palette-item"),
      grid.content("workspace-target"),
      "east",
    );
    await expect(shellState).toHaveAttribute("data-dragging", "true");

    await page.keyboard.press("Escape");

    await expect(shellState).toHaveAttribute("data-dragging", "false");
    expect(
      await page.evaluate(() => window.gridTest.shellDragStates.at(-1)),
    ).toEqual({ dragging: false });
    await grid.finishNativeDrag();
    expect(await writeCount(page)).toBe(0);
  });
});

test.describe("GridLayout controllers", () => {
  test("keeps nested controllers stable and isolated", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "nested-controllers" });
    await expect(component).toContainText("Child");

    const result = await page.evaluate(async () => {
      const { controllers } = window.gridTest;
      const childController = controllers["child-grid"];
      const childSnapshot = childController.getSnapshot();
      controllers["parent-grid"].dispatch({
        index: 0,
        size: "120px",
        track: "column",
        type: "resize-track",
      });
      await new Promise((resolve) => requestAnimationFrame(resolve));
      return {
        sameController:
          window.gridTest.controllers["child-grid"] === childController,
        sameSnapshot:
          window.gridTest.controllers["child-grid"].getSnapshot() ===
          childSnapshot,
      };
    });

    expect(result).toEqual({ sameController: true, sameSnapshot: true });
    await expect(component.locator(".vuuGridLayout#parent-grid")).toHaveCSS(
      "grid-template-columns",
      "120px 300px",
    );
  });

  test("restores a stack after its layout remounts", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "remountable-stack" });
    const grid = new GridLayoutDriver(component, page);
    await expect(grid.tabItem("second")).toBeVisible();

    await component.getByTestId("close-second").click();
    await expect(grid.tabItem("second")).toHaveCount(0);
    await component.getByTestId("toggle-stack").click();
    await expect(grid.layout("persisted-stack")).toHaveCount(0);
    await component.getByTestId("toggle-stack").click();

    await expect(grid.layout("persisted-stack")).toBeVisible();
    await expect(grid.item("first")).toBeVisible();
  });
});

test.describe("GridLayout stack splitter", () => {
  for (const [splitDirection, orientation] of [
    ["south", "horizontal"],
    ["east", "vertical"],
  ] as const) {
    test(`tracks a stack created in the ${splitDirection} split through resize and dissolve`, async ({
      mount,
      page,
    }) => {
      const component = await mount(fixture, {
        variant: `stack-splitter-${splitDirection}`,
      });
      const grid = new GridLayoutDriver(component, page);
      const separator = grid
        .separator(orientation)
        .and(component.locator('[data-resized-child-items-before="target"]'));

      await component.getByTestId("split-template").click();
      const teal = component
        .locator(".vuuGridLayoutItem")
        .filter({ hasText: "Teal" });
      await expect(teal).toHaveCount(1);
      const tealId = await teal.getAttribute("id");

      await component.getByTestId("stack-template").click();
      const stack = component.locator(".vuuGridLayoutStackedItem");
      await expect(stack).toHaveCount(1);
      const stackId = await stack.getAttribute("id");
      await expect(separator).toHaveCount(1);
      await expect(separator).toHaveAttribute(
        "data-resized-child-items-after",
        stackId ?? "",
      );
      await expect(separator).toHaveAttribute("aria-controls", stackId ?? "");

      const tracks = () =>
        grid
          .layout("stack-splitter-grid")
          .evaluate(
            (element, property) => element.style.getPropertyValue(property),
            orientation === "horizontal"
              ? "grid-template-rows"
              : "grid-template-columns",
          );
      const tracksBefore = await tracks();
      await grid.resize(
        separator,
        orientation === "vertical" ? -20 : 0,
        orientation === "horizontal" ? -20 : 0,
      );
      await expect.poll(tracks).not.toBe(tracksBefore);

      await component.getByTestId("dissolve-stack").click();
      await expect(stack).toHaveCount(0);
      await expect(separator).toHaveCount(1);
      await expect(separator).toHaveAttribute(
        "data-resized-child-items-after",
        tealId ?? "",
      );
      await expect(separator).toHaveAttribute("aria-controls", tealId ?? "");
    });
  }
});

test("GridLayoutItem passes its className through", async ({ mount, page }) => {
  const component = await mount(fixture, { variant: "class-name" });
  const item = new GridLayoutDriver(component, page).item("item");
  await expect(item).toHaveClass(/\bvuuGridLayoutItem\b/);
  await expect(item).toHaveClass(/\bworkspace-panel\b/);
});
