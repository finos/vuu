import { Button } from "@salt-ds/core";
import {
  type ComponentTemplate,
  GridLayout,
  type GridLayoutDocument,
  GridLayoutItem,
  GridLayoutProvider,
  GridLayoutStackedItem,
} from "@heswell/grid-layout";
import { useCallback, useMemo, useState } from "react";
import { GridPalette } from "../html/components/GridPalette";
import {
  createScenarioItem,
  paletteItems,
  ScenarioFrame,
  ScenarioGrid,
} from "./GridLayoutScenarioFixtures";
import {
  panelComponent,
  showcaseDocument,
  showcaseGridComponentRenderers,
  showcaseGridSettingsCodecs,
} from "./GridLayoutPersistenceFixtures";

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
    instructions="Drag the horizontal splitter below the header. The two equal lower rows contract proportionally and remain equal."
    title="Mixed spans with proportional row resize"
  >
    <ScenarioGrid
      cols={["1fr", "1fr"]}
      id="mixed-spans"
      rowResizeDistribution="proportional"
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

export const ProportionalUnequalRows = () => (
  <ScenarioFrame
    instructions="Drag the horizontal splitter below the header. The lower rows preserve their 1:2 height ratio as their combined height changes."
    title="Proportional resize with unequal rows"
  >
    <ScenarioGrid
      cols={["1fr", "1fr"]}
      id="proportional-unequal-rows"
      rowResizeDistribution="proportional"
      rows={["1fr", "1fr", "2fr"]}
    >
      {[
        createScenarioItem({
          area: "1/1/2/3",
          color: "#37474f",
          id: "proportional-header",
          title: "Two-column span",
        }),
        createScenarioItem({
          area: "2/1/3/2",
          color: "#5e35b1",
          id: "proportional-left-top",
          title: "One-part row",
        }),
        createScenarioItem({
          area: "3/1/4/2",
          color: "#00897b",
          id: "proportional-left-bottom",
          title: "Two-part row",
        }),
        createScenarioItem({
          area: "2/2/4/3",
          color: "#ef6c00",
          id: "proportional-right",
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

const restoredDocument = showcaseDocument({
  components: [
    panelComponent(
      "restored-green-component",
      "Restored green",
      "#2e7d32",
    ),
    panelComponent(
      "restored-purple-component",
      "Restored purple",
      "#6a1b9a",
    ),
  ],
  kind: "grid-layout",
  layout: {
    columns: ["1fr", "2fr"],
    id: "restored-layout",
    items: [
      {
        column: { span: 1, start: 1 },
        componentInstanceId: "restored-green-component",
        header: true,
        id: "restored-green",
        resizeable: "h",
        row: { span: 1, start: 1 },
        title: "Restored green",
      },
      {
        column: { span: 1, start: 2 },
        componentInstanceId: "restored-purple-component",
        header: true,
        id: "restored-purple",
        resizeable: "h",
        row: { span: 1, start: 1 },
        title: "Restored purple",
      },
    ],
    placeholderIds: [],
    rows: ["1fr"],
    stacks: [],
  },
  version: 2,
});

export const SerializationRestore = () => (
  <ScenarioFrame
    instructions="This layout is reconstructed from a schema-v2 document and typed component settings."
    title="Serialization and restore"
  >
    <GridLayoutProvider
      componentRenderers={showcaseGridComponentRenderers}
      document={restoredDocument}
      settingsCodecs={showcaseGridSettingsCodecs}
    >
      <GridLayout
        id="restored-layout"
        style={{ height: "100%", width: "100%" }}
      />
    </GridLayoutProvider>
  </ScenarioFrame>
);

const inspectorInitialDocument = showcaseDocument({
  components: [
    panelComponent("inspect-alpha-content", "Alpha", "#1565c0"),
    panelComponent("inspect-beta-content", "Beta", "#ef6c00"),
  ],
  kind: "grid-layout",
  layout: {
    columns: ["1fr", "1fr"],
    id: "layout-inspector",
    items: [
      {
        column: { span: 1, start: 1 },
        componentInstanceId: "inspect-alpha-content",
        header: true,
        id: "inspect-alpha",
        resizeable: "hv",
        row: { span: 1, start: 1 },
        title: "Alpha",
      },
      {
        column: { span: 1, start: 2 },
        componentInstanceId: "inspect-beta-content",
        header: true,
        id: "inspect-beta",
        resizeable: "hv",
        row: { span: 1, start: 1 },
        title: "Beta",
      },
    ],
    placeholderIds: [],
    rows: ["1fr"],
    stacks: [],
  },
  version: 2,
});

const getEmptyCells = (layout: GridLayoutDocument["layout"]) => {
  const occupied = new Set<string>();
  for (const item of layout.items) {
    for (
      let row = item.row.start;
      row < item.row.start + item.row.span;
      row += 1
    ) {
      for (
        let col = item.column.start;
        col < item.column.start + item.column.span;
        col += 1
      ) {
        occupied.add(`${row}/${col}`);
      }
    }
  }
  const empty: string[] = [];
  for (let row = 1; row <= layout.rows.length; row += 1) {
    for (let col = 1; col <= layout.columns.length; col += 1) {
      if (!occupied.has(`${row}/${col}`)) {
        empty.push(`${row}/${col}`);
      }
    }
  }
  return empty;
};

export const InteractiveLayoutInspector = () => {
  const [document, setDocument] = useState(inspectorInitialDocument);
  const [copyStatus, setCopyStatus] = useState("Copy JSON");
  const serializedJson = JSON.stringify(document, null, 2);
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
        <GridLayoutProvider
          componentRenderers={showcaseGridComponentRenderers}
          document={document}
          onDocumentChange={setDocument}
          settingsCodecs={showcaseGridSettingsCodecs}
        >
          <GridLayout
            id="layout-inspector"
            style={{ height: "100%", minHeight: 0, width: "100%" }}
          />
        </GridLayoutProvider>
        <aside className="gridLayoutInspector-panel">
          <dl>
            <dt>Columns</dt>
            <dd>{document.layout.columns.join(" | ")}</dd>
            <dt>Rows</dt>
            <dd>{document.layout.rows.join(" | ")}</dd>
            <dt>Item areas</dt>
            <dd>
              {document.layout.items
                .map(
                  ({ column, id, row }) =>
                    `${id}: ${row.start}/${column.start}/${row.start + row.span}/${column.start + column.span}`,
                )
                .join("\n") || "none"}
            </dd>
            <dt>Placeholder cells</dt>
            <dd>{getEmptyCells(document.layout).join(", ") || "none"}</dd>
            <dt>Stack state</dt>
            <dd>
              {document.layout.stacks
                .map(
                  ({ id, itemIds, selectedItemId }) =>
                    `${id} -> ${itemIds.join(", ")} (selected ${selectedItemId})`,
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
