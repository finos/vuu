import { Button } from "@salt-ds/core";
import {
  type ComponentTemplate,
  GridLayout,
  type GridLayoutDescriptor,
  GridLayoutItem,
  GridLayoutProvider,
  GridLayoutStackedItem,
  type SerializedGridLayout,
} from "@heswell/grid-layout";
import { useCallback, useMemo, useState } from "react";
import { GridPalette } from "../html/components/GridPalette";
import {
  createScenarioItem,
  paletteItems,
  ScenarioFrame,
  ScenarioGrid,
} from "./GridLayoutScenarioFixtures";

import "./GridLayoutScenarios.examples.css";

const oneByOne = { cols: ["1fr"], rows: ["1fr"] } as const;

export const EmptyGridPlaceholder = () => (
  <ScenarioFrame
    instructions="The model supplies a drop placeholder for the unoccupied cell."
    title="Empty grid and placeholder"
  >
    <ScenarioGrid cols={[...oneByOne.cols]} id="empty-grid" rows={[...oneByOne.rows]} />
  </ScenarioFrame>
);

export const HorizontalSplit = () => (
  <ScenarioFrame
    instructions="Drag either header onto the east or west edge of its peer."
    title="Horizontal split"
  >
    <ScenarioGrid
      cols={["1fr", "1fr"]}
      id="horizontal-split"
      rows={["1fr"]}
    >
      {[
        createScenarioItem({
          area: "1/1/2/2",
          color: "#3276b1",
          id: "horizontal-left",
          title: "Left",
        }),
        createScenarioItem({
          area: "1/2/2/3",
          color: "#6f42c1",
          id: "horizontal-right",
          title: "Right",
        }),
      ]}
    </ScenarioGrid>
  </ScenarioFrame>
);

export const VerticalSplit = () => (
  <ScenarioFrame
    instructions="Drag either header onto the north or south edge of its peer."
    title="Vertical split"
  >
    <ScenarioGrid cols={["1fr"]} id="vertical-split" rows={["1fr", "1fr"]}>
      {[
        createScenarioItem({
          area: "1/1/2/2",
          color: "#367c5b",
          id: "vertical-top",
          title: "Top",
        }),
        createScenarioItem({
          area: "2/1/3/2",
          color: "#a15c22",
          id: "vertical-bottom",
          title: "Bottom",
        }),
      ]}
    </ScenarioGrid>
  </ScenarioFrame>
);

export const MixedRowAndColumnSpans = () => (
  <ScenarioFrame
    instructions="The header spans both columns while the right item spans two rows."
    title="Mixed spans"
  >
    <ScenarioGrid
      cols={["1fr", "1fr"]}
      id="mixed-spans"
      rows={["1fr", "1fr", "1fr"]}
    >
      {[
        createScenarioItem({
          area: "1/1/2/3",
          color: "#455a64",
          id: "span-header",
          title: "Two-column span",
        }),
        createScenarioItem({
          area: "2/1/3/2",
          color: "#7b1fa2",
          id: "span-left-top",
          title: "Left top",
        }),
        createScenarioItem({
          area: "3/1/4/2",
          color: "#00796b",
          id: "span-left-bottom",
          title: "Left bottom",
        }),
        createScenarioItem({
          area: "2/2/4/3",
          color: "#c75b12",
          id: "span-right",
          title: "Two-row span",
        }),
      ]}
    </ScenarioGrid>
  </ScenarioFrame>
);

export const PaletteSplitAndReplace = () => (
  <ScenarioFrame
    instructions="Drag a swatch onto an edge to split, or onto the centre to replace the target."
    limitation="native palette drag sequencing is covered in the interactive showcase but remains a Playwright CT fixme."
    title="Palette add and replace"
  >
    <ScenarioGrid
      cols={["140px", "1fr"]}
      id="palette-replace"
      rows={["1fr"]}
    >
      {[
        <GridLayoutItem
          id="scenario-palette"
          key="scenario-palette"
          resizeable={false}
          style={{ gridArea: "1/1/2/2" }}
        >
          <GridPalette paletteItems={[...paletteItems]} />
        </GridLayoutItem>,
        createScenarioItem({
          area: "1/2/2/3",
          color: "#3949ab",
          id: "palette-target",
          title: "Drop target",
        }),
      ]}
    </ScenarioGrid>
  </ScenarioFrame>
);

export const MoveExistingItems = () => (
  <ScenarioFrame
    instructions="Drag the orange header to any edge or centre of the blue target."
    title="Move and replace existing items"
  >
    <ScenarioGrid cols={["1fr", "1fr"]} id="move-items" rows={["1fr"]}>
      {[
        createScenarioItem({
          area: "1/1/2/2",
          color: "#1565c0",
          id: "move-target",
          title: "Target",
        }),
        createScenarioItem({
          area: "1/2/2/3",
          color: "#ef6c00",
          id: "move-source",
          title: "Move me",
        }),
      ]}
    </ScenarioGrid>
  </ScenarioFrame>
);

const getNewTab = (): Omit<ComponentTemplate, "label"> => ({
  componentJson: JSON.stringify({
    props: {
      children: "New tab content",
      style: {
        alignItems: "center",
        background: "#5d4037",
        color: "white",
        display: "flex",
        height: "100%",
        justifyContent: "center",
      },
    },
    type: "div",
  }),
});

export const TabsAddRenameSelectAndClose = () => (
  <ScenarioFrame
    instructions="Select tabs, use + to add, and open each tab menu to rename or close."
    limitation="tab reorder remains intentionally omitted because its delayed spacer animation is unreliable."
    title="Tabbed stack"
  >
    <GridLayoutProvider options={{ newChildItem: { header: true } }}>
      <GridLayout
        colsAndRows={{ cols: ["1fr"], rows: ["1fr"] }}
        id="tabs-scenario"
        style={{ height: "100%", width: "100%" }}
      >
        <GridLayoutStackedItem
          allowAddTab
          getNewComponent={getNewTab}
          id="scenario-tabs"
          key="scenario-tabs"
          showMenu
          style={{ gridArea: "1/1/2/2" }}
        />
        {createScenarioItem({
          area: "1/1/2/2",
          color: "#00695c",
          contentVisible: true,
          id: "tab-alpha",
          stackId: "scenario-tabs",
          title: "Alpha",
        })}
        {createScenarioItem({
          area: "1/1/2/2",
          color: "#4527a0",
          contentVisible: false,
          id: "tab-beta",
          stackId: "scenario-tabs",
          title: "Beta",
        })}
      </GridLayout>
    </GridLayoutProvider>
  </ScenarioFrame>
);

export const RemovalAndReflow = () => (
  <ScenarioFrame
    instructions="Close either header; the remaining item expands and the unused track is removed."
    title="Removal and reflow"
  >
    <ScenarioGrid cols={["1fr", "1fr"]} id="removal-reflow" rows={["1fr"]}>
      {[
        createScenarioItem({
          area: "1/1/2/2",
          color: "#2e7d32",
          id: "remove-left",
          title: "Keep or close",
        }),
        createScenarioItem({
          area: "1/2/2/3",
          color: "#ad1457",
          id: "remove-right",
          title: "Keep or close",
        }),
      ]}
    </ScenarioGrid>
  </ScenarioFrame>
);

export const ResizableBoundary = () => (
  <ScenarioFrame
    instructions="Drag the separator in either direction; each item stops at its minimum width."
    title="Resizable boundary"
  >
    <ScenarioGrid
      cols={["1fr", "2fr"]}
      id="resizable-boundary"
      rows={["1fr"]}
    >
      {[
        createScenarioItem({
          area: "1/1/2/2",
          color: "#37474f",
          id: "resize-fixed",
          minWidth: 150,
          resizeable: "h",
          title: "150px minimum",
        }),
        createScenarioItem({
          area: "1/2/2/3",
          color: "#00838f",
          id: "resize-flexible",
          resizeable: "h",
          title: "80px default minimum",
        }),
      ]}
    </ScenarioGrid>
  </ScenarioFrame>
);

export const NonResizableBoundary = () => (
  <ScenarioFrame
    instructions="Both items opt out of resizing, so no separator is rendered."
    title="Non-resizable boundary"
  >
    <ScenarioGrid cols={["1fr", "1fr"]} id="fixed-boundary" rows={["1fr"]}>
      {[
        createScenarioItem({
          area: "1/1/2/2",
          color: "#4e342e",
          id: "fixed-a",
          resizeable: false,
          title: "Fixed A",
        }),
        createScenarioItem({
          area: "1/2/2/3",
          color: "#263238",
          id: "fixed-b",
          resizeable: false,
          title: "Fixed B",
        }),
      ]}
    </ScenarioGrid>
  </ScenarioFrame>
);

export const OpaqueNestedGridIsolation = () => (
  <ScenarioFrame
    instructions="The child layout is rendered as opaque parent content; use its own controls only."
    limitation="cross-grid drag/drop is not demonstrated because nested DragContext isolation is not yet reliable."
    title="Opaque nested GridLayout"
  >
    <GridLayoutProvider options={{ newChildItem: { header: true } }}>
      <GridLayout
        colsAndRows={{ cols: ["2fr", "1fr"], rows: ["1fr"] }}
        id="opaque-parent-grid"
        style={{ height: "100%", width: "100%" }}
      >
        <GridLayoutItem
          id="nested-grid-owner"
          key="nested-grid-owner"
          resizeable={false}
          style={{ gridArea: "1/1/2/2" }}
        >
          <GridLayout
            colsAndRows={{ cols: ["1fr"], rows: ["1fr", "1fr"] }}
            id="opaque-child-grid"
            style={{ height: "100%", width: "100%" }}
          >
            {createScenarioItem({
              area: "1/1/2/2",
              color: "#283593",
              dropTarget: false,
              header: false,
              id: "nested-one",
              resizeable: false,
              title: "Nested one",
            })}
            {createScenarioItem({
              area: "2/1/3/2",
              color: "#00695c",
              dropTarget: false,
              header: false,
              id: "nested-two",
              resizeable: false,
              title: "Nested two",
            })}
          </GridLayout>
        </GridLayoutItem>
        {createScenarioItem({
          area: "1/2/2/3",
          color: "#bf360c",
          dropTarget: false,
          header: false,
          id: "parent-peer",
          resizeable: false,
          title: "Parent peer",
        })}
      </GridLayout>
    </GridLayoutProvider>
  </ScenarioFrame>
);

const restoredLayout: SerializedGridLayout = {
  components: {
    "restored-green": {
      props: {
        children: "Restored green",
        style: {
          alignItems: "center",
          background: "#2e7d32",
          color: "white",
          display: "flex",
          height: "100%",
          justifyContent: "center",
        },
      },
      type: "div",
    },
    "restored-purple": {
      props: {
        children: "Restored purple",
        style: {
          alignItems: "center",
          background: "#6a1b9a",
          color: "white",
          display: "flex",
          height: "100%",
          justifyContent: "center",
        },
      },
      type: "div",
    },
  },
  id: "restored-layout",
  layout: {
    cols: ["1fr", "2fr"],
    gridLayoutItems: {
      "restored-green": {
        gridArea: "1/1/2/2",
        header: true,
        resizeable: "h",
        title: "Restored green",
      },
      "restored-purple": {
        gridArea: "1/2/2/3",
        header: true,
        resizeable: "h",
        title: "Restored purple",
      },
    },
    rows: ["1fr"],
  },
};

export const SerializationRestore = () => (
  <ScenarioFrame
    instructions="This layout is reconstructed directly from SerializedGridLayout JSON."
    title="Serialization and restore"
  >
    <GridLayoutProvider serializedLayout={restoredLayout}>
      <GridLayout
        id="restored-layout"
        style={{ height: "100%", width: "100%" }}
      />
    </GridLayoutProvider>
  </ScenarioFrame>
);

const inspectorInitialLayout: GridLayoutDescriptor = {
  cols: ["1fr", "1fr"],
  gridLayoutItems: {
    "inspect-alpha": {
      gridArea: "1/1/2/2",
      header: true,
      resizeable: "hv",
      title: "Alpha",
    },
    "inspect-beta": {
      gridArea: "1/2/2/3",
      header: true,
      resizeable: "hv",
      title: "Beta",
    },
  },
  rows: ["1fr"],
};

const inspectorComponents = {
  "inspect-alpha": {
    props: { children: "Alpha", style: { background: "#1565c0" } },
    type: "div",
  },
  "inspect-beta": {
    props: { children: "Beta", style: { background: "#ef6c00" } },
    type: "div",
  },
};

const getEmptyCells = (layout: GridLayoutDescriptor) => {
  const occupied = new Set<string>();
  for (const item of Object.values(layout.gridLayoutItems ?? {})) {
    const [rowStart, colStart, rowEnd, colEnd] = item.gridArea
      .split("/")
      .map(Number);
    for (let row = rowStart; row < rowEnd; row += 1) {
      for (let col = colStart; col < colEnd; col += 1) {
        occupied.add(`${row}/${col}`);
      }
    }
  }
  const empty: string[] = [];
  for (let row = 1; row <= layout.rows.length; row += 1) {
    for (let col = 1; col <= layout.cols.length; col += 1) {
      if (!occupied.has(`${row}/${col}`)) {
        empty.push(`${row}/${col}`);
      }
    }
  }
  return empty;
};

export const InteractiveLayoutInspector = () => {
  const [layout, setLayout] = useState(inspectorInitialLayout);
  const [copyStatus, setCopyStatus] = useState("Copy JSON");
  const handleChange = useCallback(
    (_gridId: string, nextLayout: GridLayoutDescriptor) => {
      setLayout(nextLayout);
    },
    [],
  );
  const serialized = useMemo<SerializedGridLayout>(
    () => ({
      components: Object.fromEntries(
        Object.entries(inspectorComponents).filter(([id]) =>
          Object.hasOwn(layout.gridLayoutItems ?? {}, id),
        ),
      ),
      id: "layout-inspector",
      layout,
    }),
    [layout],
  );
  const serializedJson = JSON.stringify(serialized, null, 2);
  const stackState = Object.entries(layout.gridLayoutItems ?? {}).filter(
    ([, item]) => item.stackId,
  );
  const copyJson = useCallback(() => {
    void navigator.clipboard.writeText(serializedJson).then(
      () => setCopyStatus("Copied"),
      () => setCopyStatus("Copy failed"),
    );
  }, [serializedJson]);

  return (
    <ScenarioFrame
      instructions="Move, replace, close, stack, or resize items and inspect the live model."
      title="Interactive layout inspector"
    >
      <div className="gridLayoutInspector">
        <ScenarioGrid
          cols={inspectorInitialLayout.cols}
          id="layout-inspector"
          onChange={handleChange}
          rows={inspectorInitialLayout.rows}
        >
          {[
            createScenarioItem({
              area: "1/1/2/2",
              color: "#1565c0",
              id: "inspect-alpha",
              title: "Alpha",
            }),
            createScenarioItem({
              area: "1/2/2/3",
              color: "#ef6c00",
              id: "inspect-beta",
              title: "Beta",
            }),
          ]}
        </ScenarioGrid>
        <aside className="gridLayoutInspector-panel">
          <dl>
            <dt>Columns</dt>
            <dd>{layout.cols.join(" | ")}</dd>
            <dt>Rows</dt>
            <dd>{layout.rows.join(" | ")}</dd>
            <dt>Item areas</dt>
            <dd>
              {Object.entries(layout.gridLayoutItems ?? {})
                .map(([id, item]) => `${id}: ${item.gridArea}`)
                .join("\n") || "none"}
            </dd>
            <dt>Placeholder cells</dt>
            <dd>{getEmptyCells(layout).join(", ") || "none"}</dd>
            <dt>Stack state</dt>
            <dd>
              {stackState
                .map(
                  ([id, item]) =>
                    `${id} -> ${item.stackId}${item.contentVisible ? " (active)" : ""}`,
                )
                .join("\n") || "none"}
            </dd>
          </dl>
          <Button onClick={copyJson}>{copyStatus}</Button>
          <pre aria-label="Serialized GridLayout JSON" tabIndex={0}>
            {serializedJson}
          </pre>
        </aside>
      </div>
    </ScenarioFrame>
  );
};
