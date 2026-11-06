import { Button, FlexLayout, Text } from "@salt-ds/core";
import {
  GridLayout,
  GridLayoutItem,
  GridLayoutProvider,
  GridLayoutStackedItem,
  useGridLayoutHistory,
} from "@vuu-ui/grid-layout";
import { GridPalette } from "../html/components/GridPalette";
import { paletteItems } from "./GridLayoutScenarioFixtures";

const panelStyle = {
  alignItems: "center",
  display: "flex",
  height: "100%",
  justifyContent: "center",
};

const Panel = ({ label }: { label: string }) => (
  <div style={panelStyle}>{label}</div>
);

const HistoryToolbar = () => {
  const { canRedo, canUndo, redo, undo } = useGridLayoutHistory();
  return (
    <FlexLayout align="center" gap={1} padding={1}>
      <Button disabled={!canUndo} onClick={undo}>
        Undo
      </Button>
      <Button disabled={!canRedo} onClick={redo}>
        Redo
      </Button>
      <Text>Or Ctrl+Z / Ctrl+Shift+Z with focus in the layout</Text>
    </FlexLayout>
  );
};

/**
 * Close, drag, stack, resize or drop palette templates, then undo. The outer
 * and nested grids share the GridLayoutProvider's history, so undo reverts
 * the most recent change in either. Closed items come back with their
 * content. Selecting a tab is not an undo step, and repeated arrow key
 * resizes of one splitter are one step.
 */
export const UndoRedo = () => (
  <GridLayoutProvider options={{ newChildItem: { header: true } }}>
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <HistoryToolbar />
      {/* prettier-ignore */}
      <GridLayout
        colsAndRows={{ cols: ["160px", "1fr", "1fr"], rows: ["1fr", "1fr"] }}
        id="undo-redo"
        style={{ flex: "1 1 auto", minHeight: 0 }}
      >
        <GridLayoutItem id="undo-palette" resizeable="h" style={{ gridArea: "1/1/3/2" }}>
          <GridPalette paletteItems={[...paletteItems]} />
        </GridLayoutItem>
        <GridLayoutItem data-drop-target id="undo-orders" title="Orders" header resizeable="hv" style={{ gridArea: "1/2/2/3" }}>
          <Panel label="Orders" />
        </GridLayoutItem>
        <GridLayoutStackedItem id="undo-blotters" style={{ gridArea: "1/3/2/4" }} />
        <GridLayoutItem data-drop-target id="undo-trades" title="Trades" stackId="undo-blotters" header resizeable="hv" style={{ gridArea: "1/3/2/4" }}>
          <Panel label="Trades" />
        </GridLayoutItem>
        <GridLayoutItem data-drop-target id="undo-positions" title="Positions" stackId="undo-blotters" header resizeable="hv" style={{ gridArea: "1/3/2/4" }}>
          <Panel label="Positions" />
        </GridLayoutItem>
        <GridLayoutItem data-drop-target id="undo-news" title="News" header resizeable="hv" style={{ gridArea: "2/2/3/3" }}>
          <Panel label="News" />
        </GridLayoutItem>
        <GridLayoutItem id="undo-nested-host" title="Nested grid" header resizeable="hv" style={{ gridArea: "2/3/3/4" }}>
          <GridLayout
            colsAndRows={{ cols: ["1fr", "1fr"], rows: ["1fr"] }}
            id="undo-redo-nested"
            style={{ height: "100%", width: "100%" }}
          >
            <GridLayoutItem data-drop-target id="undo-prices" title="Prices" header resizeable="hv" style={{ gridArea: "1/1/2/2" }}>
              <Panel label="Prices" />
            </GridLayoutItem>
            <GridLayoutItem data-drop-target id="undo-depth" title="Depth" header resizeable="hv" style={{ gridArea: "1/2/2/3" }}>
              <Panel label="Depth" />
            </GridLayoutItem>
          </GridLayout>
        </GridLayoutItem>
      </GridLayout>
    </div>
  </GridLayoutProvider>
);
