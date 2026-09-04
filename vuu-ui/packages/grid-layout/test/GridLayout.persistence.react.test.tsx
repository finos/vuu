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
});
