import { act, StrictMode, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  type GridController,
  GridLayout,
  GridLayoutItem,
  GridLayoutProvider,
  GridLayoutStackedItem,
  useGridController,
  useGridLayoutDispatch,
} from "../src";
import {
  useGridLayoutDragLeaveHandler,
  useGridLayoutDragPreviewHandler,
} from "../src/GridLayoutContext";

const ControllerCapture = ({
  capture,
}: {
  capture: (controller: GridController) => void;
}) => {
  capture(useGridController());
  return null;
};

const DragHandlerCapture = ({
  capture,
}: {
  capture: (
    preview: ReturnType<typeof useGridLayoutDragPreviewHandler>,
    leave: ReturnType<typeof useGridLayoutDragLeaveHandler>,
  ) => void;
}) => {
  capture(useGridLayoutDragPreviewHandler(), useGridLayoutDragLeaveHandler());
  return null;
};

const RemountableStack = ({
  capture,
}: {
  capture: (controller: GridController) => void;
}) => {
  const [mounted, setMounted] = useState(true);
  const StackContent = () => {
    const dispatch = useGridLayoutDispatch();
    return (
      <>
        <ControllerCapture capture={capture} />
        <button
          onClick={() => dispatch({ id: "second", type: "close" })}
          type="button"
        >
          Close second
        </button>
      </>
    );
  };
  return (
    <GridLayoutProvider>
      <button onClick={() => setMounted((value) => !value)} type="button">
        Toggle
      </button>
      {mounted ? (
        <GridLayout
          colsAndRows={{ cols: ["1fr"], rows: ["1fr"] }}
          id="persisted-stack"
        >
          <GridLayoutStackedItem
            id="persisted-tabs"
            style={{ gridArea: "1/1/2/2" }}
          />
          <GridLayoutItem
            contentVisible
            id="first"
            stackId="persisted-tabs"
            title="First"
          >
            <StackContent />
          </GridLayoutItem>
          <GridLayoutItem
            contentVisible={false}
            id="second"
            stackId="persisted-tabs"
            title="Second"
          >
            Second
          </GridLayoutItem>
        </GridLayout>
      ) : null}
    </GridLayoutProvider>
  );
};

describe("GridLayout canonical snapshot rendering", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT: boolean;
      }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT: boolean;
      }
    ).IS_REACT_ACT_ENVIRONMENT = false;
  });

  it("renders descriptor tracks and item placement from controller snapshots", () => {
    let controller: GridController | undefined;
    act(() => {
      root.render(
        <GridLayout
          colsAndRows={{ cols: ["100px", "1fr"], rows: ["1fr"] }}
          id="snapshot-grid"
        >
          <GridLayoutItem id="left" style={{ gridArea: "1/1/2/2" }}>
            <ControllerCapture capture={(value) => (controller = value)} />
          </GridLayoutItem>
          <GridLayoutItem id="right" style={{ gridArea: "1/2/2/3" }}>
            Right
          </GridLayoutItem>
        </GridLayout>,
      );
    });

    const grid = container.querySelector<HTMLElement>("#snapshot-grid");
    const left = container.querySelector<HTMLElement>("#left");
    expect(grid?.style.gridTemplateColumns).toBe("100px 1fr");
    expect(left?.style.gridArea).toBe("1/1/2/2");

    act(() => {
      controller?.dispatch({
        index: 0,
        size: "140px",
        track: "column",
        type: "resize-track",
      });
    });
    expect(grid?.style.gridTemplateColumns).toBe("140px 1fr");
  });

  it("renders stack order, selection, and duplicate-title identity canonically", () => {
    let controller: GridController | undefined;
    act(() => {
      root.render(
        <GridLayout
          colsAndRows={{ cols: ["1fr"], rows: ["1fr"] }}
          id="stack-grid"
        >
          <GridLayoutStackedItem
            id="stack"
            minWidth={120}
            resizeable="hv"
            style={{ gridArea: "1/1/2/2" }}
          />
          <GridLayoutItem
            contentVisible
            id="alpha"
            stackId="stack"
            title="Duplicate"
          >
            <ControllerCapture capture={(value) => (controller = value)} />
          </GridLayoutItem>
          <GridLayoutItem
            contentVisible={false}
            id="beta"
            stackId="stack"
            title="Duplicate"
          >
            Beta
          </GridLayoutItem>
        </GridLayout>,
      );
    });

    const tabIds = () =>
      [
        ...container.querySelectorAll<HTMLElement>(
          "[data-grid-layout-item-id]",
        ),
      ].map((tab) => tab.dataset.gridLayoutItemId);
    expect(tabIds()).toEqual(["alpha", "beta"]);
    expect(controller?.getSnapshot().items[0]).toMatchObject({
      column: { span: 1, start: 1 },
      minWidth: 120,
      resizeable: "hv",
      row: { span: 1, start: 1 },
    });
    expect(container.querySelector("#alpha")).not.toBeNull();
    expect(container.querySelector("#beta")).toBeNull();

    act(() => {
      controller?.dispatch({
        itemId: "beta",
        stackId: "stack",
        type: "select-stack-item",
      });
      controller?.dispatch({
        itemId: "beta",
        position: "before",
        stackId: "stack",
        targetItemId: "alpha",
        type: "reorder-stack-item",
      });
      controller?.dispatch({
        itemId: "beta",
        title: "Renamed",
        type: "rename-item",
      });
    });

    expect(tabIds()).toEqual(["beta", "alpha"]);
    expect(container.querySelector("#beta")).not.toBeNull();
    expect(container.querySelector("#alpha")).toBeNull();
    expect(
      container.querySelector('[data-grid-layout-item-id="beta"]')?.textContent,
    ).toContain("Renamed");
  });

  it("keeps nested controllers stable and subscriptions isolated", () => {
    let parentController: GridController | undefined;
    let childController: GridController | undefined;
    act(() => {
      root.render(
        <GridLayout
          colsAndRows={{ cols: ["1fr", "1fr"], rows: ["1fr"] }}
          id="parent-grid"
        >
          <GridLayoutItem id="nested-owner" style={{ gridArea: "1/1/2/2" }}>
            <ControllerCapture
              capture={(value) => (parentController = value)}
            />
            <GridLayout
              colsAndRows={{ cols: ["1fr"], rows: ["1fr"] }}
              id="child-grid"
            >
              <GridLayoutItem id="child" style={{ gridArea: "1/1/2/2" }}>
                <ControllerCapture
                  capture={(value) => (childController = value)}
                />
              </GridLayoutItem>
            </GridLayout>
          </GridLayoutItem>
          <GridLayoutItem id="peer" style={{ gridArea: "1/2/2/3" }}>
            Peer
          </GridLayoutItem>
        </GridLayout>,
      );
    });

    const initialChildController = childController;
    const initialChildSnapshot = childController?.getSnapshot();

    act(() => {
      parentController?.dispatch({
        index: 0,
        size: "120px",
        track: "column",
        type: "resize-track",
      });
    });

    expect(childController).toBe(initialChildController);
    expect(childController?.getSnapshot()).toBe(initialChildSnapshot);
  });

  it("cleans drag cancellation listeners across StrictMode remounts", () => {
    const addListener = vi.spyOn(window, "addEventListener");
    const removeListener = vi.spyOn(window, "removeEventListener");
    act(() => {
      root.render(
        <StrictMode>
          <GridLayout
            colsAndRows={{ cols: ["1fr"], rows: ["1fr"] }}
            id="strict-drag-grid"
          >
            <GridLayoutItem id="strict-item" style={{ gridArea: "1/1/2/2" }}>
              Strict
            </GridLayoutItem>
          </GridLayout>
        </StrictMode>,
      );
    });

    act(() => root.unmount());

    for (const eventName of ["keydown", "pointercancel"]) {
      const additions = addListener.mock.calls.filter(
        ([name]) => name === eventName,
      );
      const removals = removeListener.mock.calls.filter(
        ([name]) => name === eventName,
      );
      expect(removals).toHaveLength(additions.length);
      for (const [, listener] of additions) {
        expect(removals.some(([, removed]) => removed === listener)).toBe(true);
      }
    }
  });

  it("publishes cardinal previews and keeps source removal on drag leave", () => {
    let controller: GridController | undefined;
    let preview: ReturnType<typeof useGridLayoutDragPreviewHandler> | undefined;
    let leave: ReturnType<typeof useGridLayoutDragLeaveHandler> | undefined;
    act(() => {
      root.render(
        <GridLayout
          colsAndRows={{ cols: ["1fr", "1fr"], rows: ["1fr"] }}
          id="preview-grid"
        >
          <GridLayoutItem
            id="preview-left"
            resizeable="hv"
            style={{ gridArea: "1/1/2/2" }}
          >
            <ControllerCapture capture={(value) => (controller = value)} />
            <DragHandlerCapture
              capture={(previewHandler, leaveHandler) => {
                preview = previewHandler;
                leave = leaveHandler;
              }}
            />
          </GridLayoutItem>
          <GridLayoutItem
            id="preview-right"
            resizeable="hv"
            style={{ gridArea: "1/2/2/3" }}
          >
            Right
          </GridLayoutItem>
        </GridLayout>,
      );
    });
    const baseline = controller?.getSnapshot();

    act(() => {
      preview?.(
        "preview-right",
        {
          element: document.createElement("div"),
          id: "preview-left",
          label: "Left",
          layoutId: "preview-grid",
          type: "component",
        },
        "north",
      );
    });
    expect(controller?.getSnapshot().revision).toBe(0);
    expect(controller?.getSnapshot().rows).toHaveLength(2);

    act(() => leave?.());
    expect(controller?.getSnapshot()).not.toBe(baseline);
    expect(controller?.getSnapshot().items.map(({ id }) => id)).not.toContain(
      "preview-left",
    );
    expect(controller?.getSnapshot().columns).toHaveLength(1);
  });

  it("persists content without treating stack templates as serializable items", () => {
    act(() => {
      root.render(<RemountableStack capture={() => undefined} />);
    });
    const buttons = container.querySelectorAll("button");
    act(() => buttons[1]?.click());
    act(() => buttons[0]?.click());
    expect(container.querySelector("#persisted-stack")).toBeNull();
    act(() => buttons[0]?.click());
    expect(container.querySelector("#persisted-stack")).not.toBeNull();
    expect(container.querySelector("#first")).not.toBeNull();
  });
});
