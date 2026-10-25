import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  type GridController,
  GridComponentRendererRegistry,
  GridComponentSettingsRegistry,
  GridDragCoordinator,
  type GridDragSource,
  type GridDropTarget,
  GridLayout,
  type GridLayoutDocument,
  type GridLayoutDocumentChange,
  GridLayoutProvider,
  useGridController,
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

const Capture = ({
  capture,
}: {
  capture: (controller: GridController) => void;
}) => {
  capture(useGridController());
  return null;
};

const captureRenderers = (capture: (controller: GridController) => void) => {
  const registry = new GridComponentRendererRegistry();
  registry.register("label", isLabelSettings, ({ label }, id) => (
    <>
      <Capture capture={capture} />
      <span data-component-id={id}>{label}</span>
    </>
  ));
  return registry;
};

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
 * Column 2: stack "stack-1" containing "tab-a", "tab-b", "tab-c"
 */
const stackDocument: GridLayoutDocument = {
  components: [
    component("component-solo", "Solo"),
    component("component-tab-a", "Tab A"),
    component("component-tab-b", "Tab B"),
    component("component-tab-c", "Tab C"),
  ],
  kind: "grid-layout",
  layout: {
    columns: ["100px", "100px"],
    id: "change-grid",
    items: [
      item("solo", "Solo", 1),
      item("tab-a", "Tab A", 2),
      item("tab-b", "Tab B", 2),
      item("tab-c", "Tab C", 2),
    ],
    placeholderIds: [],
    rows: ["1fr"],
    stacks: [
      {
        id: "stack-1",
        itemIds: ["tab-a", "tab-b", "tab-c"],
        selectedItemId: "tab-a",
      },
    ],
  },
  version: 2,
};

type ChangeHandler = (
  document: GridLayoutDocument,
  change: GridLayoutDocumentChange,
) => void;

const stackOf = (document: GridLayoutDocument, stackId = "stack-1") =>
  document.layout.stacks.find(({ id }) => id === stackId);

const itemIdsOf = (document: GridLayoutDocument) =>
  document.layout.items.map(({ id }) => id);

describe("GridLayoutProvider onDocumentChange notifications", () => {
  let container: HTMLDivElement;
  let root: Root;
  let controller: GridController | undefined;
  let onDocumentChange: ReturnType<typeof vi.fn<ChangeHandler>>;

  const renderGrid = () => {
    act(() =>
      root.render(
        <GridLayoutProvider
          componentRenderers={captureRenderers((value) => (controller = value))}
          document={stackDocument}
          onDocumentChange={onDocumentChange}
          settingsCodecs={codecs}
        >
          <GridLayout id="change-grid" />
        </GridLayoutProvider>,
      ),
    );
    expect(onDocumentChange).not.toHaveBeenCalled();
    if (!controller) {
      throw Error("controller was not captured");
    }
    return controller;
  };

  const lastChange = () => {
    const calls = onDocumentChange.mock.calls;
    const [document, change] = calls[calls.length - 1];
    expect(change.document).toBe(document);
    return { change, document };
  };

  const drag = (
    gridController: GridController,
    source: GridDragSource,
    target: Omit<GridDropTarget, "gridId">,
  ) => {
    const coordinator = new GridDragCoordinator("change-grid", gridController);
    act(() => {
      expect(coordinator.begin(source)).toMatchObject({ ok: true });
      expect(
        coordinator.preview({ ...target, gridId: "change-grid" }),
      ).toMatchObject({ ok: true });
    });
    expect(onDocumentChange).not.toHaveBeenCalled();
    act(() => {
      expect(coordinator.commit()).toMatchObject({ ok: true });
    });
  };

  beforeEach(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    controller = undefined;
    onDocumentChange = vi.fn<ChangeHandler>();
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

  it("fires when an item is closed from its header close button", () => {
    renderGrid();
    const closeButton = container.querySelector<HTMLButtonElement>(
      "#solo .vuuGridLayoutItemHeader-close",
    );
    if (!closeButton) {
      throw Error("close button for #solo not rendered");
    }

    act(() => closeButton.click());

    expect(onDocumentChange).toHaveBeenCalledTimes(1);
    const { change, document } = lastChange();
    expect(change.kind).toBe("dispatch");
    expect(change.removedComponentInstanceIds).toEqual(["component-solo"]);
    expect(itemIdsOf(document)).not.toContain("solo");
    expect(container.querySelector("#solo")).toBeNull();
  });

  it("fires when a stack member is closed", () => {
    const gridController = renderGrid();

    act(() => {
      gridController.dispatch({
        itemId: "tab-b",
        reason: "close",
        type: "remove-item",
      });
    });

    expect(onDocumentChange).toHaveBeenCalledTimes(1);
    const { change, document } = lastChange();
    expect(change.kind).toBe("dispatch");
    expect(change.removedComponentInstanceIds).toEqual(["component-tab-b"]);
    expect(stackOf(document)?.itemIds).toEqual(["tab-a", "tab-c"]);
  });

  it("fires when a tab is selected in a stack", () => {
    renderGrid();
    const tab = container.querySelector<HTMLElement>(
      "#stack-1 [data-grid-layout-item-id='tab-c'] button",
    );
    if (!tab) {
      throw Error("tab-c trigger not rendered");
    }

    act(() => tab.click());

    expect(onDocumentChange).toHaveBeenCalledTimes(1);
    const { change, document } = lastChange();
    expect(change.kind).toBe("dispatch");
    expect(change.removedComponentInstanceIds).toEqual([]);
    expect(stackOf(document)).toMatchObject({
      itemIds: ["tab-a", "tab-b", "tab-c"],
      selectedItemId: "tab-c",
    });
  });

  it("fires when stack tabs are reordered", () => {
    const gridController = renderGrid();

    drag(
      gridController,
      {
        itemId: "tab-a",
        kind: "stack-member",
        selected: true,
        sourceGridId: "change-grid",
        stackId: "stack-1",
      },
      {
        intent: { kind: "stack", position: "after", targetItemId: "tab-c" },
        targetId: "stack-1",
      },
    );

    expect(onDocumentChange).toHaveBeenCalledTimes(1);
    const { change, document } = lastChange();
    expect(change.kind).toBe("drag");
    expect(change.removedComponentInstanceIds).toEqual([]);
    expect(stackOf(document)).toMatchObject({
      itemIds: ["tab-b", "tab-c", "tab-a"],
      selectedItemId: "tab-a",
    });
  });

  it("fires when an item is moved into a stack", () => {
    const gridController = renderGrid();

    drag(
      gridController,
      { itemId: "solo", kind: "existing-item", sourceGridId: "change-grid" },
      {
        intent: { kind: "stack", position: "before", targetItemId: "tab-a" },
        targetId: "stack-1",
      },
    );

    expect(onDocumentChange).toHaveBeenCalledTimes(1);
    const { change, document } = lastChange();
    expect(change.kind).toBe("drag");
    expect(change.removedComponentInstanceIds).toEqual([]);
    expect(stackOf(document)?.itemIds).toEqual([
      "solo",
      "tab-a",
      "tab-b",
      "tab-c",
    ]);
  });

  it("fires when an item is moved out of a stack", () => {
    const gridController = renderGrid();

    drag(
      gridController,
      {
        itemId: "tab-b",
        kind: "stack-member",
        selected: false,
        sourceGridId: "change-grid",
        stackId: "stack-1",
      },
      {
        intent: { kind: "split", position: "south" },
        targetId: "solo",
      },
    );

    expect(onDocumentChange).toHaveBeenCalledTimes(1);
    const { change, document } = lastChange();
    expect(change.kind).toBe("drag");
    expect(change.removedComponentInstanceIds).toEqual([]);
    expect(stackOf(document)?.itemIds).toEqual(["tab-a", "tab-c"]);
    expect(itemIdsOf(document)).toContain("tab-b");
  });
});
