import {
  GridLayout,
  type GridLayoutDocument,
  GridLayoutProvider,
  type TypedComponentTemplate,
} from "@heswell/grid-layout";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { jsonValueWorkspaceComponentCodec } from "../../src";
import {
  createPortalComponentRegistries,
  PortalDragSourceScope,
  usePortalDragSource,
  vuuTableTemplate,
} from "../../src/portal";

class TestDataTransfer {
  effectAllowed = "uninitialized";
  readonly values = new Map<string, string>();
  setData(type: string, value: string) {
    this.values.set(type, value);
  }
}

const dispatchDrag = (
  element: Element,
  type: string,
  dataTransfer: TestDataTransfer,
  point = { clientX: 50, clientY: 50 },
) => {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(event, {
    clientX: { value: point.clientX },
    clientY: { value: point.clientY },
    dataTransfer: { value: dataTransfer },
  });
  act(() => element.dispatchEvent(event));
};

const setRect = (element: Element) => {
  element.getBoundingClientRect = () =>
    ({
      bottom: 100,
      height: 100,
      left: 0,
      right: 100,
      top: 0,
      width: 100,
      x: 0,
      y: 0,
    }) as DOMRect;
};

const PaletteRow = ({
  onDragEnd,
  template,
}: {
  onDragEnd?: (dropped: boolean) => void;
  template: TypedComponentTemplate;
}) => {
  const dragSource = usePortalDragSource(template, { onDragEnd });
  return (
    <div data-testid="palette-row" {...dragSource}>
      {template.label}
    </div>
  );
};

const { renderers, settingsCodecs } = createPortalComponentRegistries({
  additional: [
    {
      codec: jsonValueWorkspaceComponentCodec,
      render: (settings) => <span>{String(settings)}</span>,
      type: "note",
    },
  ],
});

const workspaceDocument = {
  components: [
    { id: "component-note", settings: "Note", type: "note", version: 1 },
  ],
  kind: "grid-layout",
  layout: {
    columns: ["1fr"],
    id: "workspace",
    items: [
      {
        column: { span: 1, start: 1 },
        componentInstanceId: "component-note",
        dropTarget: true,
        header: true,
        id: "note",
        resizeable: "hv",
        row: { span: 1, start: 1 },
        title: "Note",
      },
    ],
    placeholderIds: [],
    rows: ["1fr"],
    stacks: [],
  },
  version: 2,
} as unknown as GridLayoutDocument;

describe("usePortalDragSource", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.stubGlobal("requestAnimationFrame", () => 0);
    vi.stubGlobal("cancelAnimationFrame", () => undefined);
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  it("returns draggable props for the template", () => {
    const template = vuuTableTemplate({
      module: "SIMUL",
      serverId: "s",
      table: "prices",
    });
    act(() =>
      root.render(
        <GridLayoutProvider>
          <PortalDragSourceScope>
            <PaletteRow template={template} />
          </PortalDragSourceScope>
        </GridLayoutProvider>,
      ),
    );
    const row = container.querySelector("[data-testid='palette-row']");
    expect(row?.getAttribute("draggable")).toBe("true");
    expect(row?.getAttribute("data-template-component-type")).toBe("vuu-table");
    expect(row?.closest(".vuuGridLayout")).not.toBeNull();
  });

  it("throws a clear error without a drag runtime", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const template = vuuTableTemplate({
      module: "SIMUL",
      serverId: "s",
      table: "prices",
    });
    expect(() =>
      act(() => root.render(<PaletteRow template={template} />)),
    ).toThrow(/PortalDragSourceScope/);
  });

  it("drags a template from a palette into a sibling workspace GridLayout", () => {
    const onDocumentChange = vi.fn();
    const onDragEnd = vi.fn();
    const template = vuuTableTemplate({
      label: "Prices",
      module: "SIMUL",
      serverId: "server-a",
      table: "prices",
    });
    act(() =>
      root.render(
        <GridLayoutProvider
          componentRenderers={renderers}
          document={workspaceDocument}
          onDocumentChange={onDocumentChange}
          settingsCodecs={settingsCodecs}
        >
          <PortalDragSourceScope>
            <PaletteRow onDragEnd={onDragEnd} template={template} />
          </PortalDragSourceScope>
          <GridLayout id="workspace" />
        </GridLayoutProvider>,
      ),
    );
    const source = container.querySelector("[data-testid='palette-row']");
    const target = container.querySelector("#note .vuuGridLayoutItemContent");
    if (!source || !target) {
      throw Error("fixture did not render");
    }
    setRect(source);
    setRect(target);
    const dataTransfer = new TestDataTransfer();
    const point = { clientX: 90, clientY: 50 };

    dispatchDrag(source, "dragstart", dataTransfer);
    dispatchDrag(target, "dragenter", dataTransfer, point);
    dispatchDrag(target, "dragover", dataTransfer, point);
    dispatchDrag(target, "drop", dataTransfer, point);
    dispatchDrag(source, "dragend", dataTransfer);

    expect(onDocumentChange).toHaveBeenCalledTimes(1);
    const [document] = onDocumentChange.mock.calls[0] as [GridLayoutDocument];
    expect(document.components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          settings: { module: "SIMUL", serverId: "server-a", table: "prices" },
          type: "vuu-table",
          version: 1,
        }),
      ]),
    );
    expect(onDragEnd).toHaveBeenCalledWith(true);
    expect(
      container.querySelector("#workspace .vuuTableComponent"),
    ).not.toBeNull();
  });
});
