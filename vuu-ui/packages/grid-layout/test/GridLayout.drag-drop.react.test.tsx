import { queryClosest } from "@vuu-ui/vuu-utils";
import { act, type DragEvent as ReactDragEvent, useCallback } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  GridLayout,
  GridLayoutItem,
  GridLayoutProvider,
  type TemplateSource,
  useDraggable,
  useGridLayoutDragStartHandler,
} from "../src";

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
  return event;
};

const setTargetRect = (element: Element) => {
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

let nextAnimationFrameId = 1;
let pendingAnimationFrames = new Map<number, FrameRequestCallback>();

const flushAnimationFrames = () => {
  const callbacks = [...pendingAnimationFrames.values()];
  pendingAnimationFrames.clear();
  act(() => {
    for (const callback of callbacks) {
      callback(0);
    }
  });
};

const TemplatePalette = () => {
  const onDragStart = useGridLayoutDragStartHandler();
  const getDragSource = useCallback(
    (event: ReactDragEvent<Element>): TemplateSource => {
      const element = queryClosest(
        event.target,
        "[data-testid='palette-item']",
      );
      const layout = queryClosest(element, ".vuuGridLayout", true);
      return {
        componentJson: JSON.stringify({
          label: "Template",
          props: {
            "data-testid": "template-content",
            children: "Template",
          },
          type: "div",
        }),
        element,
        label: "Template",
        layoutId: layout.id,
        type: "template",
      };
    },
    [],
  );
  const draggable = useDraggable({ getDragSource, onDragStart });

  return (
    <button data-testid="palette-item" draggable type="button" {...draggable}>
      Template
    </button>
  );
};

const ExistingItemFixture = () => (
  <GridLayoutProvider options={{ newChildItem: { header: true } }}>
    <GridLayout
      colsAndRows={{ cols: ["1fr", "1fr"], rows: ["1fr"] }}
      id="drag-grid"
    >
      <GridLayoutItem
        data-drop-target
        header
        id="source"
        resizeable="hv"
        style={{ gridArea: "1/1/2/2" }}
        title="Source"
      >
        <div>Source content</div>
      </GridLayoutItem>
      <GridLayoutItem
        data-drop-target
        header
        id="target"
        resizeable="hv"
        style={{ gridArea: "1/2/2/3" }}
        title="Target"
      >
        <div>Target content</div>
      </GridLayoutItem>
    </GridLayout>
  </GridLayoutProvider>
);

const PaletteFixture = () => (
  <GridLayoutProvider options={{ newChildItem: { header: true } }}>
    <GridLayout
      colsAndRows={{ cols: ["160px", "1fr"], rows: ["1fr"] }}
      id="palette-grid"
    >
      <GridLayoutItem id="palette" style={{ gridArea: "1/1/2/2" }}>
        <TemplatePalette />
      </GridLayoutItem>
      <GridLayoutItem
        data-drop-target
        header
        id="target"
        resizeable="hv"
        style={{ gridArea: "1/2/2/3" }}
        title="Target"
      >
        <div>Target content</div>
      </GridLayoutItem>
    </GridLayout>
  </GridLayoutProvider>
);

const PlaceholderFixture = () => (
  <GridLayoutProvider options={{ newChildItem: { header: true } }}>
    <GridLayout
      colsAndRows={{ cols: ["160px", "1fr"], rows: ["1fr"] }}
      id="placeholder-grid"
    >
      <GridLayoutItem id="palette" style={{ gridArea: "1/1/2/2" }}>
        <TemplatePalette />
      </GridLayoutItem>
    </GridLayout>
  </GridLayoutProvider>
);

const InvalidTargetFixture = () => (
  <GridLayoutProvider options={{ newChildItem: { header: true } }}>
    <GridLayout
      colsAndRows={{ cols: ["1fr", "1fr"], rows: ["1fr"] }}
      id="invalid-grid"
    >
      <GridLayoutItem
        data-drop-target
        header
        id="source"
        resizeable="hv"
        style={{ gridArea: "1/1/2/2" }}
        title="Source"
      >
        <div>Source content</div>
      </GridLayoutItem>
      <GridLayoutItem
        data-drop-target
        id="fixed"
        resizeable={false}
        style={{ gridArea: "1/2/2/3" }}
      >
        <div>Fixed content</div>
      </GridLayoutItem>
    </GridLayout>
  </GridLayoutProvider>
);

const NestedPaletteFixture = () => (
  <GridLayoutProvider options={{ newChildItem: { header: true } }}>
    <GridLayout
      colsAndRows={{ cols: ["160px", "1fr"], rows: ["1fr"] }}
      id="parent-grid"
    >
      <GridLayoutItem id="palette" style={{ gridArea: "1/1/2/2" }}>
        <TemplatePalette />
      </GridLayoutItem>
      <GridLayoutItem id="nested-owner" style={{ gridArea: "1/2/2/3" }}>
        <GridLayout
          colsAndRows={{ cols: ["1fr"], rows: ["1fr"] }}
          id="nested-grid"
        >
          <GridLayoutItem
            data-drop-target
            header
            id="nested-target"
            resizeable="hv"
            style={{ gridArea: "1/1/2/2" }}
            title="Nested target"
          >
            <div>Nested target content</div>
          </GridLayoutItem>
        </GridLayout>
      </GridLayoutItem>
    </GridLayout>
  </GridLayoutProvider>
);

describe("GridLayout React drag/drop lifecycle", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    nextAnimationFrameId = 1;
    pendingAnimationFrames = new Map();
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      const id = nextAnimationFrameId++;
      pendingAnimationFrames.set(id, callback);
      return id;
    });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => {
      pendingAnimationFrames.delete(id);
    });
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT: boolean;
      }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT: boolean;
      }
    ).IS_REACT_ACT_ENVIRONMENT = false;
    vi.unstubAllGlobals();
  });

  it("previews and commits an existing item through DOM drag events", () => {
    act(() => root.render(<ExistingItemFixture />));
    const source = container.querySelector(
      "#source .vuuGridLayoutItemHeader-title",
    );
    const target = container.querySelector("#target .vuuGridLayoutItemContent");
    if (!source || !target) {
      throw Error("existing-item drag fixture did not render");
    }
    setTargetRect(target);
    const dataTransfer = new TestDataTransfer();

    dispatchDrag(source, "dragstart", dataTransfer);
    flushAnimationFrames();
    expect(
      container
        .querySelector("#source")
        ?.classList.contains("vuuGridLayoutItem-dragging"),
    ).toBe(true);
    dispatchDrag(target, "dragenter", dataTransfer, {
      clientX: 90,
      clientY: 50,
    });
    const dragOver = dispatchDrag(target, "dragover", dataTransfer, {
      clientX: 90,
      clientY: 50,
    });

    expect(dragOver.defaultPrevented).toBe(true);
    expect(target.classList.contains("vuuDropTarget-east")).toBe(true);

    dispatchDrag(target, "drop", dataTransfer, { clientX: 90, clientY: 50 });
    const renderedSource = container.querySelector(
      "#source .vuuGridLayoutItemHeader-title",
    );
    if (renderedSource) {
      dispatchDrag(renderedSource, "dragend", dataTransfer);
    }

    expect(container.querySelector("#source")).not.toBeNull();
    expect(container.querySelector("#target")).not.toBeNull();
    expect(
      container.querySelector("#source")?.getAttribute("style"),
    ).not.toContain("grid-area: 1 / 1 / 2 / 2");
    expect(target.classList.contains("vuuDropTarget-east")).toBe(false);
  });

  it("previews and commits a palette template through DOM drag events", () => {
    act(() => root.render(<PaletteFixture />));
    const source = container.querySelector("[data-testid='palette-item']");
    const target = container.querySelector("#target .vuuGridLayoutItemContent");
    if (!source || !target) {
      throw Error("palette drag fixture did not render");
    }
    setTargetRect(source);
    setTargetRect(target);
    const dataTransfer = new TestDataTransfer();

    dispatchDrag(source, "dragstart", dataTransfer);
    flushAnimationFrames();
    dispatchDrag(target, "dragenter", dataTransfer, {
      clientX: 50,
      clientY: 10,
    });
    const dragOver = dispatchDrag(target, "dragover", dataTransfer, {
      clientX: 50,
      clientY: 10,
    });

    expect(dataTransfer.values.has("text/json")).toBe(true);
    expect(dragOver.defaultPrevented).toBe(true);
    expect(target.classList.contains("vuuDropTarget-north")).toBe(true);

    dispatchDrag(target, "drop", dataTransfer, { clientX: 50, clientY: 10 });
    dispatchDrag(source, "dragend", dataTransfer);

    expect(
      container.querySelector("[data-testid='template-content']"),
    ).not.toBeNull();
    expect(target.classList.contains("vuuDropTarget-north")).toBe(false);
  });

  it.each([
    {
      point: { clientX: 50, clientY: 50 },
      selector: "#target .vuuGridLayoutItemContent",
      zone: "centre",
    },
    {
      point: { clientX: 50, clientY: 12 },
      selector: "#target .vuuGridLayoutItemHeader",
      zone: "header",
    },
  ])("renders and clears the $zone affordance", ({ point, selector, zone }) => {
    act(() => root.render(<ExistingItemFixture />));
    const source = container.querySelector(
      "#source .vuuGridLayoutItemHeader-title",
    );
    const target = container.querySelector(selector);
    if (!source || !target) {
      throw Error(`${zone} affordance fixture did not render`);
    }
    setTargetRect(target);
    const dataTransfer = new TestDataTransfer();

    dispatchDrag(source, "dragstart", dataTransfer);
    flushAnimationFrames();
    dispatchDrag(target, "dragenter", dataTransfer, point);
    const dragOver = dispatchDrag(target, "dragover", dataTransfer, point);

    expect(dragOver.defaultPrevented).toBe(true);
    expect(target.classList.contains(`vuuDropTarget-${zone}`)).toBe(true);

    dispatchDrag(source, "dragend", dataTransfer);

    expect(target.classList.contains(`vuuDropTarget-${zone}`)).toBe(false);
  });

  it("renders the centre affordance for an empty placeholder", () => {
    act(() => root.render(<PlaceholderFixture />));
    const source = container.querySelector("[data-testid='palette-item']");
    const target = container.querySelector(".vuuGridPlaceholder");
    if (!source || !target) {
      throw Error("placeholder drag fixture did not render");
    }
    setTargetRect(source);
    setTargetRect(target);
    const dataTransfer = new TestDataTransfer();

    dispatchDrag(source, "dragstart", dataTransfer);
    flushAnimationFrames();
    dispatchDrag(target, "dragenter", dataTransfer);
    const dragOver = dispatchDrag(target, "dragover", dataTransfer);

    expect(dragOver.defaultPrevented).toBe(true);
    expect(target.classList.contains("vuuDropTarget-centre")).toBe(true);

    dispatchDrag(source, "dragend", dataTransfer);

    expect(target.classList.contains("vuuDropTarget-centre")).toBe(false);
  });

  it("does not enable drop or render an affordance for an invalid split", () => {
    act(() => root.render(<InvalidTargetFixture />));
    const source = container.querySelector(
      "#source .vuuGridLayoutItemHeader-title",
    );
    const target = container.querySelector("#fixed .vuuGridLayoutItemContent");
    if (!source || !target) {
      throw Error("invalid-target drag fixture did not render");
    }
    setTargetRect(target);
    const dataTransfer = new TestDataTransfer();
    const point = { clientX: 90, clientY: 50 };

    dispatchDrag(source, "dragstart", dataTransfer);
    flushAnimationFrames();
    dispatchDrag(target, "dragenter", dataTransfer, point);
    const dragOver = dispatchDrag(target, "dragover", dataTransfer, point);

    expect(dragOver.defaultPrevented).toBe(false);
    expect(
      [...target.classList].some((className) =>
        className.startsWith("vuuDropTarget-"),
      ),
    ).toBe(false);

    dispatchDrag(source, "dragend", dataTransfer);
  });

  it.each([
    "Escape",
    "pointercancel",
  ] as const)("rolls back the preview and clears affordances on %s", (cancellation) => {
    act(() => root.render(<ExistingItemFixture />));
    const source = container.querySelector(
      "#source .vuuGridLayoutItemHeader-title",
    );
    const target = container.querySelector("#target .vuuGridLayoutItemContent");
    if (!source || !target) {
      throw Error("cancelled drag fixture did not render");
    }
    setTargetRect(target);
    const dataTransfer = new TestDataTransfer();
    const point = { clientX: 90, clientY: 50 };

    dispatchDrag(source, "dragstart", dataTransfer);
    flushAnimationFrames();
    dispatchDrag(target, "dragenter", dataTransfer, point);
    dispatchDrag(target, "dragover", dataTransfer, point);
    expect(target.classList.contains("vuuDropTarget-east")).toBe(true);

    act(() => {
      if (cancellation === "Escape") {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      } else {
        window.dispatchEvent(new Event("pointercancel"));
      }
    });

    expect(target.classList.contains("vuuDropTarget-east")).toBe(false);
    expect(
      container
        .querySelector("#source")
        ?.classList.contains("vuuGridLayoutItem-dragging"),
    ).toBe(false);
    expect(container.querySelector("#source")?.getAttribute("style")).toContain(
      "grid-area: 1/1/2/2",
    );
  });

  it("does not restore drag styling when cancelled before the next frame", () => {
    act(() => root.render(<ExistingItemFixture />));
    const source = container.querySelector(
      "#source .vuuGridLayoutItemHeader-title",
    );
    if (!source) {
      throw Error("early-cancel drag fixture did not render");
    }
    const dataTransfer = new TestDataTransfer();

    dispatchDrag(source, "dragstart", dataTransfer);
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    flushAnimationFrames();

    expect(
      container
        .querySelector("#source")
        ?.classList.contains("vuuGridLayoutItem-dragging"),
    ).toBe(false);
    expect(
      container.querySelector("#drag-grid")?.classList.contains("vuuDragging"),
    ).toBe(false);
  });

  it("routes a palette drop to the deepest nested grid", () => {
    act(() => root.render(<NestedPaletteFixture />));
    const source = container.querySelector("[data-testid='palette-item']");
    const target = container.querySelector(
      "#nested-target .vuuGridLayoutItemContent",
    );
    if (!source || !target) {
      throw Error("nested palette drag fixture did not render");
    }
    setTargetRect(source);
    setTargetRect(target);
    const dataTransfer = new TestDataTransfer();
    const point = { clientX: 90, clientY: 50 };

    dispatchDrag(source, "dragstart", dataTransfer);
    flushAnimationFrames();
    dispatchDrag(target, "dragenter", dataTransfer, point);
    const dragOver = dispatchDrag(target, "dragover", dataTransfer, point);

    expect(dragOver.defaultPrevented).toBe(true);
    expect(target.classList.contains("vuuDropTarget-east")).toBe(true);

    dispatchDrag(target, "drop", dataTransfer, point);
    dispatchDrag(source, "dragend", dataTransfer);

    const template = container.querySelector(
      "#nested-grid [data-testid='template-content']",
    );
    expect(template).not.toBeNull();
    expect(
      container.querySelector("#parent-grid > #nested-owner"),
    ).not.toBeNull();
  });

  it("clears a nested palette affordance when the drag is cancelled", () => {
    act(() => root.render(<NestedPaletteFixture />));
    const source = container.querySelector("[data-testid='palette-item']");
    const target = container.querySelector(
      "#nested-target .vuuGridLayoutItemContent",
    );
    if (!source || !target) {
      throw Error("nested cancellation fixture did not render");
    }
    setTargetRect(source);
    setTargetRect(target);
    const dataTransfer = new TestDataTransfer();
    const point = { clientX: 90, clientY: 50 };

    dispatchDrag(source, "dragstart", dataTransfer);
    flushAnimationFrames();
    dispatchDrag(target, "dragenter", dataTransfer, point);
    dispatchDrag(target, "dragover", dataTransfer, point);
    expect(target.classList.contains("vuuDropTarget-east")).toBe(true);

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });

    expect(target.classList.contains("vuuDropTarget-east")).toBe(false);
    expect(
      container.querySelector("#nested-grid [data-testid='template-content']"),
    ).toBeNull();
  });
});
