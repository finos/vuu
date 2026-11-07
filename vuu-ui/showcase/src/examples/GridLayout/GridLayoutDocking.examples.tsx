import { Button, FlexLayout, Text } from "@salt-ds/core";
import {
  GridLayout,
  GridLayoutItem,
  GridLayoutProvider,
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

const DockingToolbar = () => {
  const { canRedo, canUndo, redo, undo } = useGridLayoutHistory();
  return (
    <FlexLayout align="center" gap={1} padding={1}>
      <Button disabled={!canUndo} onClick={undo}>
        Undo
      </Button>
      <Button disabled={!canRedo} onClick={redo}>
        Redo
      </Button>
      <Text>
        Drag an item, or a palette entry, close to an edge of the layout
      </Text>
    </FlexLayout>
  );
};

/**
 * Drag an item by its header close to an outer edge of the layout to dock it
 * along the whole of that edge. It keeps its width, or height, across the
 * edge. A palette entry docks at a quarter of the layout. Docks can be undone.
 */
export const EdgeDocking = () => (
  <GridLayoutProvider options={{ newChildItem: { header: true } }}>
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <DockingToolbar />
      {/* prettier-ignore */}
      <GridLayout
        colsAndRows={{ cols: ["160px", "1fr"], rows: ["1fr"] }}
        id="edge-docking-shell"
        style={{ flex: "1 1 auto", minHeight: 0 }}
      >
        <GridLayoutItem id="dock-palette" resizeable="h" style={{ gridArea: "1/1/2/2" }}>
          <GridPalette paletteItems={[...paletteItems]} />
        </GridLayoutItem>
        <GridLayoutItem id="dock-host" resizeable="h" style={{ gridArea: "1/2/2/3" }}>
          <GridLayout
            colsAndRows={{ cols: ["1fr", "1fr"], rows: ["1fr", "1fr"] }}
            dockable
            id="edge-docking"
            style={{ height: "100%", width: "100%" }}
          >
            <GridLayoutItem data-drop-target id="dock-orders" title="Orders" header resizeable="hv" style={{ gridArea: "1/1/2/2" }}>
              <Panel label="Orders" />
            </GridLayoutItem>
            <GridLayoutItem data-drop-target id="dock-trades" title="Trades" header resizeable="hv" style={{ gridArea: "1/2/2/3" }}>
              <Panel label="Trades" />
            </GridLayoutItem>
            <GridLayoutItem data-drop-target id="dock-news" title="News" header resizeable="hv" style={{ gridArea: "2/1/3/2" }}>
              <Panel label="News" />
            </GridLayoutItem>
            <GridLayoutItem data-drop-target id="dock-prices" title="Prices" header resizeable="hv" style={{ gridArea: "2/2/3/3" }}>
              <Panel label="Prices" />
            </GridLayoutItem>
          </GridLayout>
        </GridLayoutItem>
      </GridLayout>
    </div>
  </GridLayoutProvider>
);
