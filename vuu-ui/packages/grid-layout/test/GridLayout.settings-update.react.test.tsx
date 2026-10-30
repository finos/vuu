import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  GridComponentRendererRegistry,
  GridComponentSettingsRegistry,
  GridLayout,
  type GridComponentSettingsUpdater,
  type GridLayoutDocument,
  type GridLayoutDocumentChange,
  GridLayoutDocumentController,
  GridLayoutProvider,
  useGridComponentSettingsUpdater,
} from "../src";

type LabelSettings = { readonly label: string };

const isLabelSettings = (value: unknown): value is LabelSettings =>
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
          error: { code: "INVALID", message: "invalid", path: "$" },
          ok: false,
        },
  encode: (value) => ({ ok: true, value }),
  isSettings: isLabelSettings,
  version: 1,
});

let updater: GridComponentSettingsUpdater | undefined;
const Label = ({ id, label }: LabelSettings & { id: string }) => {
  updater = useGridComponentSettingsUpdater();
  return <span data-component-id={id}>{label}</span>;
};

const UpdaterProbe = () => {
  updater = useGridComponentSettingsUpdater();
  return null;
};

const renderers = new GridComponentRendererRegistry();
renderers.register("label", isLabelSettings, ({ label }, id) => (
  <Label id={id} label={label} />
));

const gridDocument: GridLayoutDocument = {
  components: [
    { id: "component-a", settings: { label: "A" }, type: "label", version: 1 },
    { id: "component-b", settings: { label: "B" }, type: "label", version: 1 },
  ],
  kind: "grid-layout",
  layout: {
    columns: ["1fr", "1fr"],
    id: "settings-grid",
    items: [
      {
        column: { span: 1, start: 1 },
        componentInstanceId: "component-a",
        id: "a",
        row: { span: 1, start: 1 },
      },
      {
        column: { span: 1, start: 2 },
        componentInstanceId: "component-b",
        id: "b",
        row: { span: 1, start: 1 },
      },
    ],
    placeholderIds: [],
    rows: ["1fr"],
    stacks: [],
  },
  version: 2,
} as unknown as GridLayoutDocument;

type ChangeHandler = (
  document: GridLayoutDocument,
  change: GridLayoutDocumentChange,
) => void;

describe("useGridComponentSettingsUpdater", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    updater = undefined;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("publishes a settings change for the component", () => {
    const onDocumentChange = vi.fn<ChangeHandler>();
    const documentController = new GridLayoutDocumentController();
    act(() =>
      root.render(
        <GridLayoutProvider
          componentRenderers={renderers}
          document={gridDocument}
          documentController={documentController}
          onDocumentChange={onDocumentChange}
          settingsCodecs={codecs}
        >
          <GridLayout id="settings-grid" />
        </GridLayoutProvider>,
      ),
    );
    expect(updater).toBeDefined();

    let result = false;
    act(() => {
      result = updater?.("component-b", { label: "B2" }) ?? false;
    });

    expect(result).toBe(true);
    expect(onDocumentChange).toHaveBeenCalledTimes(1);
    const [document, change] = onDocumentChange.mock.calls[0];
    expect(change.kind).toBe("settings");
    expect(change.removedComponentInstanceIds).toEqual([]);
    expect(document.components).toEqual([
      gridDocument.components[0],
      {
        id: "component-b",
        settings: { label: "B2" },
        type: "label",
        version: 1,
      },
    ]);
    expect(documentController.getSnapshot()).toBe(document);

    act(() => {
      updater?.("component-a", { label: "A2" });
    });
    expect(onDocumentChange.mock.calls[1][0].components).toEqual([
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

  it("rejects unknown components and invalid settings", () => {
    const onDocumentChange = vi.fn<ChangeHandler>();
    const onDocumentError = vi.fn();
    act(() =>
      root.render(
        <GridLayoutProvider
          componentRenderers={renderers}
          document={gridDocument}
          onDocumentChange={onDocumentChange}
          onDocumentError={onDocumentError}
          settingsCodecs={codecs}
        >
          <GridLayout id="settings-grid" />
        </GridLayoutProvider>,
      ),
    );
    expect(updater?.("missing", { label: "x" })).toBe(false);
    expect(updater?.("component-a", { label: 42 })).toBe(false);
    expect(onDocumentError).toHaveBeenCalledTimes(1);
    expect(onDocumentChange).not.toHaveBeenCalled();
  });

  it("is a no-op outside a GridLayoutProvider", () => {
    act(() => root.render(<UpdaterProbe />));
    expect(updater?.("component-a", { label: "x" })).toBe(false);
  });
});
