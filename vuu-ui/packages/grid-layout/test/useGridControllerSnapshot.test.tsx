import { StrictMode, act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GridController } from "../src/GridController";
import { GridModel } from "../src/GridModel";
import { useGridControllerSnapshot } from "../src/useGridControllerSnapshot";
import { descriptor, item } from "./model-scenario-harness";

const createController = () =>
  new GridController(
    new GridModel(
      "react-store",
      descriptor(["100px", "100px"], ["1fr"], {
        left: item("1/1/2/2", { title: "Left" }),
        right: item("1/2/2/3", { title: "Right" }),
      }),
    ),
  );

const SnapshotView = ({
  controller,
  onRender,
}: {
  controller: GridController;
  onRender: () => void;
}) => {
  const snapshot = useGridControllerSnapshot(controller);
  onRender();
  return (
    <output data-revision={snapshot.revision}>
      {snapshot.columns.map(({ size }) => size).join(" ")}
    </output>
  );
};

describe("useGridControllerSnapshot", () => {
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
    vi.restoreAllMocks();
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT: boolean;
      }
    ).IS_REACT_ACT_ENVIRONMENT = false;
  });

  it("renders once per semantic dispatch and ignores rejected and no-op commands", () => {
    const controller = createController();
    const onRender = vi.fn();
    act(() => root.render(<SnapshotView {...{ controller, onRender }} />));
    expect(onRender).toHaveBeenCalledTimes(1);

    act(() => {
      controller.dispatch({
        itemId: "missing",
        title: "Missing",
        type: "rename-item",
      });
      controller.dispatch({
        itemId: "left",
        title: "Left",
        type: "rename-item",
      });
    });
    expect(onRender).toHaveBeenCalledTimes(1);

    act(() => {
      controller.dispatch({
        index: 0,
        size: "125px",
        track: "column",
        type: "resize-track",
      });
    });
    expect(onRender).toHaveBeenCalledTimes(2);
    expect(container.textContent).toBe("125px 100px");
  });

  it("renders previews and rollback, without rerendering an unchanged commit", () => {
    const controller = createController();
    const onRender = vi.fn();
    act(() => root.render(<SnapshotView {...{ controller, onRender }} />));
    const start = controller.beginTransaction("resize");
    expect(start.ok).toBe(true);
    if (!start.ok) {
      return;
    }

    act(() => {
      start.transaction.dispatch({
        index: 0,
        size: "125px",
        track: "column",
        type: "resize-track",
      });
    });
    expect(onRender).toHaveBeenCalledTimes(2);
    act(() => start.transaction.commit());
    expect(onRender).toHaveBeenCalledTimes(2);

    const rollback = controller.beginTransaction("resize");
    expect(rollback.ok).toBe(true);
    if (!rollback.ok) {
      return;
    }
    act(() => {
      rollback.transaction.dispatch({
        index: 0,
        size: "150px",
        track: "column",
        type: "resize-track",
      });
    });
    expect(onRender).toHaveBeenCalledTimes(3);
    act(() => rollback.transaction.rollback());
    expect(onRender).toHaveBeenCalledTimes(4);
    expect(container.textContent).toBe("125px 100px");
  });

  it("cleans up every StrictMode subscription on unmount", () => {
    const controller = createController();
    const originalSubscribe = controller.subscribe;
    let activeSubscriptions = 0;
    vi.spyOn(controller, "subscribe").mockImplementation((listener) => {
      activeSubscriptions += 1;
      const unsubscribe = originalSubscribe(listener);
      let active = true;
      return () => {
        if (active) {
          active = false;
          activeSubscriptions -= 1;
          unsubscribe();
        }
      };
    });

    act(() =>
      root.render(
        <StrictMode>
          <SnapshotView controller={controller} onRender={() => undefined} />
        </StrictMode>,
      ),
    );
    expect(activeSubscriptions).toBe(1);
    act(() => root.unmount());
    expect(activeSubscriptions).toBe(0);
    root = createRoot(container);
  });
});
