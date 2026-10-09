import { act, createContext, useContext, useState } from "react";
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
import { ModuleContextPanel } from "../../src/context-panel/ModuleContextPanel";
import { SlotContextPanelProvider } from "../../src/context-panel/ContextPanelSlot";

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

  describe("content owners", () => {
    const OwnerContext = createContext("shell");
    const OwnerValue = () => <p data-content>{useContext(OwnerContext)}</p>;

    const showers: Record<string, ShowContextPanel> = {};
    const hiders: Record<string, (() => void) | undefined> = {};
    const Owner = ({ name }: { name: string }) => {
      showers[name] = useContextPanel();
      hiders[name] = useHideContextPanel();
      return null;
    };

    let setShowModuleB: (show: boolean) => void = () => undefined;
    const Shell = ({ placementB }: { placementB?: "module" }) => {
      const [showModuleB, setShow] = useState(true);
      setShowModuleB = setShow;
      return (
        <ShellContextPanelProvider>
          <OwnerContext.Provider value="module-a">
            <SlotContextPanelProvider>
              <Owner name="a" />
            </SlotContextPanelProvider>
          </OwnerContext.Provider>
          {showModuleB ? (
            <div data-module-b>
              <OwnerContext.Provider value="module-b">
                <ModuleContextPanel placement={placementB}>
                  <Owner name="b" />
                </ModuleContextPanel>
              </OwnerContext.Provider>
            </div>
          ) : null}
          <ShellContextPanel />
        </ShellContextPanelProvider>
      );
    };

    const shellContent = () =>
      container.querySelector("#vuu-shell-context [data-content]");

    it("renders content with its owner's context", () => {
      act(() => root.render(<Shell />));
      act(() => showers.a(<OwnerValue />, "A"));
      expect(shellContent()?.textContent).toBe("module-a");
    });

    it("replaces content from another owner, which can no longer hide it", () => {
      act(() => root.render(<Shell />));
      act(() => showers.a(<OwnerValue />, "A"));
      act(() => showers.b(<OwnerValue />, "B"));
      expect(
        container.querySelectorAll("#vuu-shell-context [data-content]"),
      ).toHaveLength(1);
      expect(shellContent()?.textContent).toBe("module-b");
      expect(
        container.querySelector("#vuu-shell-context h2")?.textContent,
      ).toBe("B");

      act(() => hiders.a?.());
      expect(shellContent()?.textContent).toBe("module-b");
      act(() => hiders.b?.());
      expect(shellContent()).toBeNull();
    });

    it("closes when the owner unmounts", () => {
      act(() => root.render(<Shell />));
      act(() => showers.b(<OwnerValue />, "B"));
      act(() => setShowModuleB(false));
      expect(shellContent()).toBeNull();
      expect(
        container.querySelector("#context-panel")?.classList,
      ).not.toContain("vuuContextPanel-expanded");
    });

    it("closes on Escape from within portalled content", () => {
      act(() => root.render(<Shell />));
      act(() => showers.a(<OwnerValue />, "A"));
      act(() => {
        shellContent()?.dispatchEvent(
          new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }),
        );
      });
      expect(shellContent()).toBeNull();
    });

    it("hosts content within the module when placement is module", () => {
      act(() => root.render(<Shell placementB="module" />));
      act(() => showers.b(<OwnerValue />, "B"));
      expect(shellContent()).toBeNull();
      expect(
        container.querySelector(
          "[data-module-b] .vuuModuleContextPanel [data-content]",
        )?.textContent,
      ).toBe("module-b");

      // The shell and module panels are independent.
      act(() => showers.a(<OwnerValue />, "A"));
      expect(shellContent()?.textContent).toBe("module-a");
      expect(
        container.querySelector("[data-module-b] [data-content]")?.textContent,
      ).toBe("module-b");
    });
  });
});
