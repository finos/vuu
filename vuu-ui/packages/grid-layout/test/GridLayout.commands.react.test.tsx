import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  GridComponentRendererRegistry,
  GridComponentSettingsRegistry,
  GridLayout,
  type GridLayoutCommands,
  type GridLayoutDocument,
  GridLayoutProvider,
  type TypedComponentTemplate,
  useGridLayoutCommands,
} from "../src";

const isLabelSettings = (value: unknown): value is { readonly label: string } =>
  typeof value === "object" &&
  value !== null &&
  "label" in value &&
  typeof value.label === "string";

const codecs = new GridComponentSettingsRegistry();
codecs.register("label", {
  decode: (value) =>
    isLabelSettings(value)
      ? { ok: true, value }
      : {
          error: {
            code: "INVALID_LABEL",
            message: "label must be a string",
            path: "$.label",
          },
          ok: false,
        },
  encode: (value) => ({ ok: true, value }),
  isSettings: isLabelSettings,
  version: 1,
});

const renderers = new GridComponentRendererRegistry();
renderers.register("label", isLabelSettings, ({ label }, id) => (
  <span data-component-id={id} data-label={label}>
    {label}
  </span>
));

const component = (id: string, label: string) => ({
  id,
  settings: { label },
  type: "label",
  version: 1,
});

const item = (id: string, title: string, columnStart: number) => ({
  column: { span: 1, start: columnStart },
  componentInstanceId: `component-${id}`,
  header: true,
  id,
  resizeable: "hv" as const,
  row: { span: 1, start: 1 },
  title,
});

/**
 * Column 1: standalone item "solo"
 * Column 2: stack "stack-1" containing "tab-a", "tab-b"
 */
const stackDocument: GridLayoutDocument = {
  components: [
    component("component-solo", "Solo"),
    component("component-tab-a", "Tab A"),
    component("component-tab-b", "Tab B"),
  ],
  kind: "grid-layout",
  layout: {
    columns: ["100px", "100px"],
    id: "commands-grid",
    items: [
      item("solo", "Solo", 1),
      item("tab-a", "Tab A", 2),
      item("tab-b", "Tab B", 2),
    ],
    placeholderIds: [],
    rows: ["1fr"],
    stacks: [
      {
        id: "stack-1",
        itemIds: ["tab-a", "tab-b"],
        selectedItemId: "tab-a",
      },
    ],
  },
  version: 2,
};

const emptyDocument: GridLayoutDocument = {
  components: [],
  kind: "grid-layout",
  layout: {
    columns: ["1fr"],
    id: "commands-grid",
    items: [
      {
        column: { span: 1, start: 1 },
        id: "placeholder-1",
        row: { span: 1, start: 1 },
      },
    ],
    placeholderIds: ["placeholder-1"],
    rows: ["1fr"],
    stacks: [],
  },
  version: 2,
};

const template = (label: string): TypedComponentTemplate => ({
  component: { settings: { label }, type: "label", version: 1 },
  label,
});

const labels = (container: HTMLElement) =>
  [...container.querySelectorAll("[data-label]")].map((element) =>
    element.getAttribute("data-label"),
  );

describe("useGridLayoutCommands", () => {
  let container: HTMLDivElement;
  let root: Root;
  let commands: GridLayoutCommands | undefined;
  let documents: GridLayoutDocument[];

  const Capture = () => {
    commands = useGridLayoutCommands();
    return null;
  };

  const renderGrid = (document: GridLayoutDocument) => {
    act(() =>
      root.render(
        <GridLayoutProvider
          componentRenderers={renderers}
          document={document}
          onDocumentChange={(next) => documents.push(next)}
          settingsCodecs={codecs}
        >
          <GridLayout id="commands-grid" />
          <Capture />
        </GridLayoutProvider>,
      ),
    );
    if (!commands) {
      throw Error("commands not registered");
    }
    return commands;
  };

  const insert = (
    gridCommands: GridLayoutCommands,
    ...args: Parameters<GridLayoutCommands["insertTemplate"]>
  ) => {
    let itemId = "";
    act(() => {
      itemId = gridCommands.insertTemplate(...args);
    });
    return itemId;
  };

  const lastDocument = () => documents[documents.length - 1];

  beforeEach(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    commands = undefined;
    documents = [];
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = false;
  });

  it("is undefined outside a GridLayoutProvider", () => {
    act(() => root.render(<Capture />));
    expect(commands).toBeUndefined();
  });

  it("reports content and placeholder items", () => {
    const gridCommands = renderGrid(stackDocument);
    expect(gridCommands.gridId).toBe("commands-grid");
    expect(gridCommands.getContentItemIds()).toEqual([
      "solo",
      "tab-a",
      "tab-b",
    ]);
    expect(gridCommands.getPlaceholderIds()).toEqual([]);
    expect(renderGrid(emptyDocument).getPlaceholderIds()).toEqual([
      "placeholder-1",
    ]);
  });

  it("fills a placeholder", () => {
    const gridCommands = renderGrid(emptyDocument);
    const itemId = insert(gridCommands, template("New"), {
      kind: "replace",
      targetId: "placeholder-1",
    });
    expect(labels(container)).toEqual(["New"]);
    expect(gridCommands.getContentItemIds()).toEqual([itemId]);
    expect(gridCommands.getPlaceholderIds()).toEqual([]);
    expect(lastDocument().components).toHaveLength(1);
  });

  it("replaces the content of a standalone item", () => {
    const gridCommands = renderGrid(stackDocument);
    const itemId = insert(gridCommands, template("New"), {
      kind: "replace",
      targetId: "solo",
    });
    expect(labels(container)).not.toContain("Solo");
    expect(labels(container)).toContain("New");
    expect(gridCommands.getContentItemIds()).toContain(itemId);
    expect(gridCommands.getContentItemIds()).not.toContain("solo");
  });

  it("replaces a stack member in place", () => {
    const gridCommands = renderGrid(stackDocument);
    const itemId = insert(gridCommands, template("New"), {
      kind: "replace",
      targetId: "tab-a",
    });
    const stack = lastDocument().layout.stacks[0];
    expect(stack.itemIds).toEqual([itemId, "tab-b"]);
    expect(stack.selectedItemId).toBe(itemId);
    expect(gridCommands.getContentItemIds()).not.toContain("tab-a");
  });

  it("splits the target", () => {
    const gridCommands = renderGrid(stackDocument);
    const itemId = insert(gridCommands, template("New"), {
      kind: "split",
      position: "east",
      targetId: "solo",
    });
    const items = lastDocument().layout.items;
    const solo = items.find(({ id }) => id === "solo");
    const inserted = items.find(({ id }) => id === itemId);
    expect(solo && inserted).toBeTruthy();
    expect(inserted?.column.start).toBeGreaterThan(solo?.column.start ?? 0);
    expect(labels(container)).toContain("New");
  });

  it("stacks with a standalone item", () => {
    const gridCommands = renderGrid(stackDocument);
    const itemId = insert(gridCommands, template("New"), {
      kind: "stack",
      targetId: "solo",
    });
    const stack = lastDocument().layout.stacks.find(({ itemIds }) =>
      itemIds.includes("solo"),
    );
    expect(stack?.itemIds).toEqual(["solo", itemId]);
    expect(stack?.selectedItemId).toBe(itemId);
  });

  it("stacks after a stack member, selecting the new tab", () => {
    const gridCommands = renderGrid(stackDocument);
    const itemId = insert(gridCommands, template("New"), {
      kind: "stack",
      targetId: "tab-a",
    });
    const stack = lastDocument().layout.stacks.find(
      ({ id }) => id === "stack-1",
    );
    expect(stack?.itemIds).toEqual(["tab-a", itemId, "tab-b"]);
    expect(stack?.selectedItemId).toBe(itemId);
  });

  it("inserts repeatedly", () => {
    const gridCommands = renderGrid(stackDocument);
    const first = insert(gridCommands, template("First"), {
      kind: "split",
      position: "east",
      targetId: "solo",
    });
    const second = insert(gridCommands, template("Second"), {
      kind: "split",
      position: "south",
      targetId: first,
    });
    expect(gridCommands.getContentItemIds()).toEqual(
      expect.arrayContaining([first, second]),
    );
    expect(labels(container)).toEqual(
      expect.arrayContaining(["First", "Second"]),
    );
  });

  it("throws for an unknown target", () => {
    const gridCommands = renderGrid(stackDocument);
    expect(() =>
      gridCommands.insertTemplate(template("New"), {
        kind: "replace",
        targetId: "missing",
      }),
    ).toThrow(/not found/);
  });

  it("notifies subscribers of changes", () => {
    const gridCommands = renderGrid(emptyDocument);
    let notified = 0;
    const unsubscribe = gridCommands.subscribe(() => {
      notified += 1;
    });
    insert(gridCommands, template("New"), {
      kind: "replace",
      targetId: "placeholder-1",
    });
    unsubscribe();
    expect(notified).toBeGreaterThan(0);
  });
});
