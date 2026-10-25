import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GridLayout, GridLayoutItem, GridLayoutProvider } from "../src";

describe("GridLayoutItem", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
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

  it("passes its className through to the rendered item", () => {
    act(() =>
      root.render(
        <GridLayoutProvider>
          <GridLayout
            colsAndRows={{ cols: ["1fr"], rows: ["1fr"] }}
            id="class-name-grid"
          >
            <GridLayoutItem
              className="workspace-panel"
              header
              id="item"
              style={{ gridArea: "1/1/2/2" }}
              title="Item"
            >
              <div>Content</div>
            </GridLayoutItem>
          </GridLayout>
        </GridLayoutProvider>,
      ),
    );

    const item = container.querySelector("#item");
    expect(item?.classList.contains("vuuGridLayoutItem")).toBe(true);
    expect(item?.classList.contains("workspace-panel")).toBe(true);
  });
});
