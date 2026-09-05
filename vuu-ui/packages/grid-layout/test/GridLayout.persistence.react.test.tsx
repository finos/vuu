import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  type GridController,
  GridComponentRendererRegistry,
  GridComponentSettingsRegistry,
  GridLayout,
  type GridLayoutDocument,
  GridLayoutItem,
  GridLayoutProvider,
  type SerializedGridLayout,
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
const renderers = new GridComponentRendererRegistry();
renderers.register("label", isLabelSettings, ({ label }, id) => (
  <span id={id}>{label}</span>
));

const captureRenderers = (
  capture: (controller: GridController) => void,
): GridComponentRendererRegistry => {
  const registry = new GridComponentRendererRegistry();
  registry.register("label", isLabelSettings, ({ label }, id) => (
    <>
      <Capture capture={capture} />
      <span data-component-id={id}>{label}</span>
    </>
  ));
  return registry;
};

const documentWithLabel = (
  gridId: string,
  componentId: string,
  label: string,
): GridLayoutDocument => ({
  components: [
    {
      id: componentId,
      settings: { label },
      type: "label",
      version: 1,
    },
  ],
  kind: "grid-layout",
  layout: {
    columns: ["1fr"],
    id: gridId,
    items: [
      {
        column: { span: 1, start: 1 },
        id: componentId,
        row: { span: 1, start: 1 },
      },
    ],
    placeholderIds: [],
    rows: ["1fr"],
    stacks: [],
  },
  version: 2,
});

const Capture = ({
  capture,
}: {
  capture: (controller: GridController) => void;
}) => {
  capture(useGridController());
  return null;
};

const interactiveDocument: GridLayoutDocument = {
  components: [
    {
      id: "component-alpha",
      settings: { label: "Alpha" },
      type: "label",
      version: 1,
    },
    {
      id: "component-beta",
      settings: { label: "Beta" },
      type: "label",
      version: 1,
    },
  ],
  kind: "grid-layout",
  layout: {
    columns: ["100px", "100px"],
    id: "interactive-grid",
    items: [
      {
        column: { span: 1, start: 1 },
        componentInstanceId: "component-alpha",
        header: true,
        id: "item-alpha",
        resizeable: "hv",
        row: { span: 1, start: 1 },
        title: "Alpha",
      },
      {
        column: { span: 1, start: 2 },
        componentInstanceId: "component-beta",
        header: true,
        id: "item-beta",
        resizeable: "hv",
        row: { span: 1, start: 1 },
        title: "Beta",
      },
    ],
    placeholderIds: [],
    rows: ["1fr"],
    stacks: [],
  },
  version: 2,
};

describe("GridLayout provider persistence", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("writes only committed semantic transitions", () => {
    const onDocumentChange = vi.fn<(document: GridLayoutDocument) => void>();
    let controller: GridController | undefined;
    act(() =>
      root.render(
        <GridLayoutProvider
          componentSettings={[
            { id: "left", settings: { label: "Left" }, type: "label" },
            { id: "right", settings: { label: "Right" }, type: "label" },
          ]}
          onDocumentChange={onDocumentChange}
          settingsCodecs={codecs}
        >
          <GridLayout
            colsAndRows={{ cols: ["100px", "100px"], rows: ["1fr"] }}
            id="persisted-grid"
          >
            <GridLayoutItem id="left" style={{ gridArea: "1/1/2/2" }}>
              <Capture capture={(value) => (controller = value)} />
            </GridLayoutItem>
            <GridLayoutItem id="right" style={{ gridArea: "1/2/2/3" }}>
              Right
            </GridLayoutItem>
          </GridLayout>
        </GridLayoutProvider>,
      ),
    );
    expect(onDocumentChange).not.toHaveBeenCalled();
    if (!controller) {
      throw new Error("controller was not captured");
    }

    act(() => {
      controller?.dispatch({
        itemId: "left",
        title: "Renamed",
        type: "rename-item",
      });
    });
    expect(onDocumentChange).toHaveBeenCalledTimes(1);

    const transaction = controller.beginTransaction("resize");
    if (!transaction.ok) {
      throw new Error(transaction.error.message);
    }
    act(() => {
      transaction.transaction.dispatch({
        index: 0,
        size: "120px",
        track: "column",
        type: "resize-track",
      });
    });
    expect(onDocumentChange).toHaveBeenCalledTimes(1);
    act(() => {
      transaction.transaction.rollback();
    });
    expect(onDocumentChange).toHaveBeenCalledTimes(1);

    const committed = controller.beginTransaction("resize");
    if (!committed.ok) {
      throw new Error(committed.error.message);
    }
    act(() => {
      committed.transaction.dispatch({
        index: 0,
        size: "125px",
        track: "column",
        type: "resize-track",
      });
      committed.transaction.commit();
    });
    expect(onDocumentChange).toHaveBeenCalledTimes(2);
  });

  it("loads and replaces typed content without an initial write", () => {
    const onDocumentChange = vi.fn<(document: GridLayoutDocument) => void>();
    const render = (document: GridLayoutDocument) => (
      <GridLayoutProvider
        componentRenderers={renderers}
        document={document}
        onDocumentChange={onDocumentChange}
        settingsCodecs={codecs}
      >
        <GridLayout id="loaded-grid" />
      </GridLayoutProvider>
    );

    act(() => root.render(render(documentWithLabel("loaded-grid", "a", "A"))));
    expect(container.querySelector("#a")?.textContent).toBe("A");
    expect(onDocumentChange).not.toHaveBeenCalled();

    act(() => root.render(render(documentWithLabel("loaded-grid", "b", "B"))));
    expect(container.querySelector("#a")).toBeNull();
    expect(container.querySelector("#b")?.textContent).toBe("B");
    expect(onDocumentChange).not.toHaveBeenCalled();
  });

  it("saves, reconstructs, and continues interacting with stable item and component ids", () => {
    const writes: GridLayoutDocument[] = [];
    let controller: GridController | undefined;
    const componentRenderers = captureRenderers(
      (value) => (controller = value),
    );
    const render = (document: GridLayoutDocument) => (
      <GridLayoutProvider
        componentRenderers={componentRenderers}
        document={document}
        onDocumentChange={(next) => writes.push(next)}
        settingsCodecs={codecs}
      >
        <GridLayout id="interactive-grid" />
      </GridLayoutProvider>
    );

    act(() => root.render(render(interactiveDocument)));
    expect(writes).toHaveLength(0);
    if (!controller) {
      throw new Error("controller was not captured");
    }
    act(() => {
      controller?.dispatch({
        index: 0,
        size: "125px",
        track: "column",
        type: "resize-track",
      });
    });
    expect(writes).toHaveLength(1);
    expect(writes[0].layout.items[0]).toMatchObject({
      componentInstanceId: "component-alpha",
      id: "item-alpha",
    });
    expect(JSON.stringify(writes[0])).not.toMatch(
      /react|function|componentJson|props/,
    );

    controller = undefined;
    act(() => root.render(render(writes[0])));
    expect(writes).toHaveLength(1);
    expect(
      container.querySelector('[data-component-id="component-alpha"]'),
    ).not.toBeNull();
    if (!controller) {
      throw new Error("reconstructed controller was not captured");
    }
    act(() => {
      controller?.dispatch({
        itemId: "item-beta",
        selectedItemId: "item-beta",
        targetId: "item-alpha",
        type: "create-stack",
      });
    });
    expect(writes).toHaveLength(2);
    expect(writes[1]).toMatchObject({
      kind: "grid-layout",
      layout: {
        columns: ["125px", "100px"],
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

  it("keeps a valid active layout when a runtime document cannot decode or render", () => {
    const errors: string[] = [];
    const render = (document: unknown, componentRenderers = renderers) => (
      <GridLayoutProvider
        componentRenderers={componentRenderers}
        document={document}
        onDocumentError={({ code }) => errors.push(code)}
        settingsCodecs={codecs}
      >
        <GridLayout id="loaded-grid" />
      </GridLayoutProvider>
    );
    const active = documentWithLabel("loaded-grid", "active", "Active");
    act(() => root.render(render(active)));

    const unknown = {
      ...active,
      components: [{ id: "active", settings: {}, type: "unknown", version: 1 }],
    };
    act(() => root.render(render(unknown)));
    expect(errors).toEqual(["COMPONENT_SETTINGS_ERROR"]);
    expect(container.querySelector("#active")?.textContent).toBe("Active");

    act(() => root.render(render(active, new GridComponentRendererRegistry())));
    expect(errors).toEqual([
      "COMPONENT_SETTINGS_ERROR",
      "COMPONENT_RENDERER_ERROR",
    ]);
    expect(container.querySelector("#active")?.textContent).toBe("Active");
  });

  it("keeps the active layout when a component settings migration fails", () => {
    const migrationCodecs = new GridComponentSettingsRegistry();
    migrationCodecs.register("label", {
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
      migrations: {
        1: () => ({
          error: {
            code: "INVALID_V1_LABEL",
            message: "legacy text must be a string",
            path: "$.text",
          },
          ok: false,
        }),
      },
      version: 2,
    });
    const active = {
      ...documentWithLabel("loaded-grid", "active", "Active"),
      components: [
        {
          id: "active",
          settings: { label: "Active" },
          type: "label",
          version: 2,
        },
      ],
    };
    const errors: string[] = [];
    const render = (document: unknown) => (
      <GridLayoutProvider
        componentRenderers={renderers}
        document={document}
        onDocumentError={({ code }) => errors.push(code)}
        settingsCodecs={migrationCodecs}
      >
        <GridLayout id="loaded-grid" />
      </GridLayoutProvider>
    );
    act(() => root.render(render(active)));
    expect(container.querySelector("#active")?.textContent).toBe("Active");

    act(() =>
      root.render(
        render({
          ...active,
          components: [
            {
              id: "active",
              settings: { text: 42 },
              type: "label",
              version: 1,
            },
          ],
        }),
      ),
    );
    expect(errors).toEqual(["COMPONENT_SETTINGS_ERROR"]);
    expect(container.querySelector("#active")?.textContent).toBe("Active");
  });

  it("reads the deprecated provider shape but writes only v2 documents", () => {
    const legacy: SerializedGridLayout = {
      components: {
        green: {
          props: { children: "Legacy green" },
          type: "div",
        },
      },
      id: "legacy-grid",
      layout: {
        cols: ["1fr"],
        gridLayoutItems: {
          green: {
            gridArea: "1/1/2/2",
            header: true,
            resizeable: "hv",
            title: "Green",
          },
        },
        rows: ["1fr"],
      },
    };
    const before = JSON.stringify(legacy);
    const onDocumentChange = vi.fn<(document: GridLayoutDocument) => void>();
    act(() =>
      root.render(
        <GridLayoutProvider
          componentSettings={[
            { id: "green", settings: { label: "Green" }, type: "label" },
          ]}
          onDocumentChange={onDocumentChange}
          serializedLayout={legacy}
          settingsCodecs={codecs}
        >
          <GridLayout id="legacy-grid" />
        </GridLayoutProvider>,
      ),
    );
    expect(container.textContent).toContain("Legacy green");
    expect(onDocumentChange).not.toHaveBeenCalled();

    const close = container.querySelector(".vuuGridLayoutItemHeader-close");
    if (!(close instanceof HTMLButtonElement)) {
      throw new Error("legacy fixture close button was not rendered");
    }
    act(() => close.click());
    expect(onDocumentChange).toHaveBeenCalledTimes(1);
    expect(onDocumentChange.mock.calls[0][0]).toMatchObject({
      kind: "grid-layout",
      version: 2,
    });
    expect(JSON.stringify(legacy)).toBe(before);
  });
});
