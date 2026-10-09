import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ContextPanelProvider,
  ShellContextPanel,
  ShellContextPanelProvider,
  useContextPanel,
  useHideContextPanel,
  type ShowContextPanel,
} from "../../src/context-panel";

let show: ShowContextPanel | undefined;
let hide: (() => void) | undefined;

const Consumer = () => {
  show = useContextPanel();
  hide = useHideContextPanel();
  return null;
};

describe("ContextPanelProvider", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    show = undefined;
    hide = undefined;
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
  });

  it("warns when there is no provider", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    act(() => root.render(<Consumer />));
    show?.(<p />, "Title");
    expect(warn).toHaveBeenCalledOnce();
    expect(hide).toBeUndefined();
  });

  it("uses the implementation it is given", () => {
    const showContextPanel = vi.fn();
    const hideContextPanel = vi.fn();
    act(() =>
      root.render(
        <ContextPanelProvider
          hideContextPanel={hideContextPanel}
          showContextPanel={showContextPanel}
        >
          <Consumer />
        </ContextPanelProvider>,
      ),
    );
    const content = <p />;
    show?.(content, "Title", { a: 1 });
    hide?.();
    expect(showContextPanel).toHaveBeenCalledWith(content, "Title", { a: 1 });
    expect(hideContextPanel).toHaveBeenCalledOnce();
  });

  it("resolves named components and delegates to an inherited implementation", () => {
    const showContextPanel = vi.fn();
    const hideContextPanel = vi.fn();
    const resolved = <p data-resolved />;
    const resolveComponent = vi.fn(() => resolved);
    act(() =>
      root.render(
        <ContextPanelProvider
          hideContextPanel={hideContextPanel}
          showContextPanel={showContextPanel}
        >
          <ContextPanelProvider resolveComponent={resolveComponent}>
            <Consumer />
          </ContextPanelProvider>
        </ContextPanelProvider>,
      ),
    );
    show?.("ColumnPicker", "Columns", { b: 2 });
    hide?.();
    expect(resolveComponent).toHaveBeenCalledWith("ColumnPicker", { b: 2 });
    expect(showContextPanel).toHaveBeenCalledWith(resolved, "Columns", {
      b: 2,
    });
    expect(hideContextPanel).toHaveBeenCalledOnce();
  });

  it("throws for an unresolved named component without an implementation", () => {
    act(() =>
      root.render(
        <ContextPanelProvider>
          <Consumer />
        </ContextPanelProvider>,
      ),
    );
    expect(() => show?.("ColumnPicker", "Columns")).toThrow(
      'Context panel component "ColumnPicker" requires a configured resolver',
    );
  });
});

describe("ShellContextPanelProvider", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const render = () =>
    act(() =>
      root.render(
        <ShellContextPanelProvider>
          <button data-trigger>Open</button>
          <Consumer />
          <ShellContextPanel className="host" />
        </ShellContextPanelProvider>,
      ),
    );

  const panel = () =>
    container.querySelector<HTMLElement>("#vuu-shell-context > #context-panel");

  it("renders the panel in the vuu-shell-context landmark", () => {
    render();
    expect(container.querySelector("#vuu-shell-context")?.className).toBe(
      "host",
    );
    expect(panel()?.classList).toContain("vuuContextPanel-overlay");
    expect(panel()?.classList).not.toContain("vuuContextPanel-expanded");
  });

  it("shows, replaces and hides content, restoring focus", async () => {
    render();
    const trigger =
      container.querySelector<HTMLButtonElement>("[data-trigger]");
    trigger?.focus();
    act(() => show?.(<p data-content>First</p>, "One"));
    expect(panel()?.classList).toContain("vuuContextPanel-expanded");
    expect(panel()?.querySelector("h2")?.textContent).toBe("One");

    act(() => show?.(<p data-content>Second</p>, "Two"));
    expect(panel()?.querySelector("[data-content]")?.textContent).toBe(
      "Second",
    );
    expect(panel()?.querySelector("h2")?.textContent).toBe("Two");

    act(() => hide?.());
    expect(panel()?.classList).not.toContain("vuuContextPanel-expanded");
    expect(panel()?.querySelector("[data-content]")).toBeNull();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(document.activeElement).toBe(trigger);
  });

  it("rejects content that is not a React element", () => {
    render();
    expect(() => show?.("ColumnPicker", "Columns")).toThrow(
      "must be provided as a React element",
    );
  });
});
