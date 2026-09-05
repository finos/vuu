import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  GridLayout,
  GridLayoutItem,
  GridLayoutProvider,
  type GridLayoutSplitDirection,
  type TemplateSource,
  useGridLayoutDispatch,
  useGridModel,
} from "../src";
import { useGridLayoutDropHandler } from "../src/GridLayoutContext";

const rect = {
  bottom: 100,
  height: 100,
  left: 0,
  right: 100,
  toJSON: () => ({}),
  top: 0,
  width: 100,
  x: 0,
  y: 0,
};

const templateSource = (label: string): TemplateSource => ({
  componentJson: JSON.stringify({
    label,
    props: { children: label },
    type: "div",
  }),
  element: document.createElement("button"),
  label,
  layoutId: "stack-splitter-test",
  type: "template",
});

const PaletteTransitionControls = ({
  splitDirection,
}: {
  splitDirection: GridLayoutSplitDirection;
}) => {
  const drop = useGridLayoutDropHandler();
  const dispatch = useGridLayoutDispatch();
  const gridModel = useGridModel();

  return (
    <>
      <button
        data-testid="split-template"
        onClick={() => drop("target", templateSource("Teal"), splitDirection)}
        type="button"
      >
        Split
      </button>
      <button
        data-testid="stack-template"
        onClick={() => {
          const teal = gridModel.childItems.find(
            ({ title }) => title === "Teal",
          );
          if (!teal) {
            throw Error("Teal palette item not found");
          }
          drop(teal.id, templateSource("Coral"), "header");
        }}
        type="button"
      >
        Stack
      </button>
      <button
        data-testid="dissolve-stack"
        onClick={() => {
          const coral = gridModel.childItems.find(
            ({ title }) => title === "Coral",
          );
          if (!coral) {
            throw Error("Coral palette item not found");
          }
          dispatch({ id: coral.id, type: "close" });
        }}
        type="button"
      >
        Dissolve
      </button>
    </>
  );
};

const StackSplitterFixture = ({
  splitDirection,
}: {
  splitDirection: GridLayoutSplitDirection;
}) => (
  <GridLayoutProvider options={{ newChildItem: { header: true } }}>
    <GridLayout
      colsAndRows={{ cols: ["140px", "200px"], rows: ["200px"] }}
      id="stack-splitter-test"
      style={{ height: 320, width: 640 }}
    >
      <GridLayoutItem id="palette" style={{ gridArea: "1/1/2/2" }}>
        <PaletteTransitionControls splitDirection={splitDirection} />
      </GridLayoutItem>
      <GridLayoutItem
        data-drop-target
        header
        id="target"
        resizeable="hv"
        style={{ gridArea: "1/2/2/3" }}
        title="Drop target"
      >
        <div>Drop target</div>
      </GridLayoutItem>
    </GridLayout>
  </GridLayoutProvider>
);

const click = async (container: HTMLElement, testId: string) => {
  const button = container.querySelector(`[data-testid="${testId}"]`);
  if (!button) {
    throw Error(`Button ${testId} not found`);
  }
  await act(async () =>
    button.dispatchEvent(new MouseEvent("click", { bubbles: true })),
  );
};

const participants = (separator: HTMLElement) => ({
  after: separator.dataset.resizedChildItemsAfter?.split(" ") ?? [],
  before: separator.dataset.resizedChildItemsBefore?.split(" ") ?? [],
});

describe("GridLayout stack splitter lifecycle", () => {
  let container: HTMLDivElement;
  let root: Root;
  let uuidSeed: number;

  beforeEach(() => {
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT: boolean;
      }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    uuidSeed = 10;
    vi.spyOn(globalThis.crypto, "getRandomValues").mockImplementation(((
      array: Uint8Array,
    ) => {
      array.fill(uuidSeed++);
      return array;
    }) as typeof globalThis.crypto.getRandomValues);
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(
      rect,
    );
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

  it.each([
    ["south", "horizontal"],
    ["east", "vertical"],
  ] as const)("projects the live stack into the %s palette splitter before resizing", async (splitDirection, ariaOrientation) => {
    await act(async () => {
      root.render(<StackSplitterFixture splitDirection={splitDirection} />);
    });
    await click(container, "split-template");

    const teal = [
      ...container.querySelectorAll<HTMLElement>(".vuuGridLayoutItem"),
    ].find((item) => item.textContent?.includes("Teal"));
    if (!teal) {
      throw Error("Rendered Teal palette item not found");
    }
    const tealId = teal.id;
    await click(container, "stack-template");

    const stack = container.querySelector<HTMLElement>(
      ".vuuGridLayoutStackedItem",
    );
    const separator = [
      ...container.querySelectorAll<HTMLElement>(
        `[role="separator"][aria-orientation="${ariaOrientation}"]`,
      ),
    ].find(
      (candidate) => candidate.dataset.resizedChildItemsBefore === "target",
    );
    if (!stack || !separator) {
      throw Error("Stacked splitter DOM was not rendered");
    }

    expect(participants(separator)).toEqual({
      after: [stack.id],
      before: ["target"],
    });
    expect(separator.getAttribute("aria-controls")).toBe(stack.id);
    expect(participants(separator).after).not.toContain(tealId);
    expect(container.querySelector(`[id="${stack.id}"]`)).toBe(stack);

    const grid = container.querySelector<HTMLElement>("#stack-splitter-test");
    const trackTemplateBefore =
      ariaOrientation === "horizontal"
        ? grid?.style.gridTemplateRows
        : grid?.style.gridTemplateColumns;
    await act(async () => {
      separator.dispatchEvent(
        new MouseEvent("mousedown", {
          bubbles: true,
          clientX: 50,
          clientY: 50,
        }),
      );
      document.dispatchEvent(
        new MouseEvent("mousemove", {
          bubbles: true,
          clientX: ariaOrientation === "vertical" ? 40 : 50,
          clientY: ariaOrientation === "horizontal" ? 40 : 50,
        }),
      );
      document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    });

    const trackTemplateAfter =
      ariaOrientation === "horizontal"
        ? grid?.style.gridTemplateRows
        : grid?.style.gridTemplateColumns;
    expect(trackTemplateAfter).not.toBe(trackTemplateBefore);

    await click(container, "dissolve-stack");
    const dissolvedSeparator = [
      ...container.querySelectorAll<HTMLElement>(
        `[role="separator"][aria-orientation="${ariaOrientation}"]`,
      ),
    ].find(
      (candidate) => candidate.dataset.resizedChildItemsBefore === "target",
    );
    expect(container.querySelector(".vuuGridLayoutStackedItem")).toBeNull();
    expect(dissolvedSeparator).not.toBeNull();
    expect(participants(dissolvedSeparator as HTMLElement).after).toEqual([
      tealId,
    ]);
    expect(dissolvedSeparator?.getAttribute("aria-controls")).toBe(tealId);
  });
});
