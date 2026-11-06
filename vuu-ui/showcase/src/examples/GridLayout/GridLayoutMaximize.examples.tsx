import { Button, FlexLayout, Text } from "@salt-ds/core";
import {
  GridLayout,
  GridLayoutItem,
  GridLayoutProvider,
  GridLayoutStackedItem,
  useGridLayoutCommands,
  useGridLayoutItemMaximizable,
} from "@vuu-ui/grid-layout";
import { useCallback, useState } from "react";

const panelStyle = {
  alignItems: "center",
  display: "flex",
  height: "100%",
  justifyContent: "center",
};

const Panel = ({ label }: { label: string }) => (
  <div style={panelStyle}>{label}</div>
);

/** Content that refuses to be maximized, e.g. because it has a fixed size. */
const FixedSizePanel = ({ label }: { label: string }) => {
  useGridLayoutItemMaximizable(false);
  return <Panel label={`${label} refuses maximize`} />;
};

/**
 * Maximize from an item's header, a stack's tab strip, or by double-clicking
 * a header. Restore, double-click again or press Escape to put the grid
 * back. "Fixed" opts out with the item's maximizable prop. The Positions
 * tab's content opts out with useGridLayoutItemMaximizable, so the stack
 * offers Maximize only while Trades is selected. The nested grid maximizes
 * within its own cell.
 */
export const MaximizeItems = () => (
  // prettier-ignore
  <GridLayout
    colsAndRows={{ cols: ["1fr", "1fr"], rows: ["1fr", "1fr"] }}
    full-page
    id="maximize-items"
    maximizable
  >
    <GridLayoutItem id="orders" title="Orders" header resizeable="hv" style={{ gridArea: "1/1/2/2" }}>
      <Panel label="Orders" />
    </GridLayoutItem>
    <GridLayoutStackedItem id="blotters" style={{ gridArea: "1/2/2/3" }} />
    <GridLayoutItem id="trades" title="Trades" stackId="blotters" header resizeable="hv" style={{ gridArea: "1/2/2/3" }}>
      <Panel label="Trades" />
    </GridLayoutItem>
    <GridLayoutItem id="positions" title="Positions" stackId="blotters" header resizeable="hv" style={{ gridArea: "1/2/2/3" }}>
      <FixedSizePanel label="Positions" />
    </GridLayoutItem>
    <GridLayoutItem id="fixed" title="Fixed" maximizable={false} header resizeable="hv" style={{ gridArea: "2/1/3/2" }}>
      <Panel label="Can't be maximized" />
    </GridLayoutItem>
    <GridLayoutItem id="nested-host" title="Nested grid" header resizeable="hv" style={{ gridArea: "2/2/3/3" }}>
      <GridLayout
        colsAndRows={{ cols: ["1fr", "1fr"], rows: ["1fr"] }}
        id="maximize-nested"
        maximizable
        style={{ height: "100%", width: "100%" }}
      >
        <GridLayoutItem id="prices" title="Prices" header resizeable="hv" style={{ gridArea: "1/1/2/2" }}>
          <Panel label="Prices" />
        </GridLayoutItem>
        <GridLayoutItem id="depth" title="Depth" header resizeable="hv" style={{ gridArea: "1/2/2/3" }}>
          <Panel label="Depth" />
        </GridLayoutItem>
      </GridLayout>
    </GridLayoutItem>
  </GridLayout>
);

const MaximizeToolbar = ({ maximizedId }: { maximizedId?: string }) => {
  const commands = useGridLayoutCommands("maximize-from-code");
  return (
    <FlexLayout align="center" gap={1} padding={1}>
      <Button onClick={() => commands?.maximize("orders-api")}>
        Maximize Orders
      </Button>
      <Button onClick={() => commands?.maximize("positions-api")}>
        Maximize Positions stack
      </Button>
      <Button disabled={!maximizedId} onClick={() => commands?.restore()}>
        Restore
      </Button>
      <Text>Maximized: {maximizedId ?? "none"}</Text>
    </FlexLayout>
  );
};

/**
 * Maximize and restore through useGridLayoutCommands. onMaximizedChange
 * keeps the toolbar in step, including when an item is maximized from its
 * header.
 */
export const MaximizeFromCode = () => {
  const [maximizedId, setMaximizedId] = useState<string>();
  const handleMaximizedChange = useCallback((id: string | undefined) => {
    setMaximizedId(id);
  }, []);
  return (
    <GridLayoutProvider>
      <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
        <MaximizeToolbar maximizedId={maximizedId} />
        {/* prettier-ignore */}
        <GridLayout
          colsAndRows={{ cols: ["1fr", "1fr"], rows: ["1fr"] }}
          id="maximize-from-code"
          maximizable
          onMaximizedChange={handleMaximizedChange}
          style={{ flex: "1 1 auto", minHeight: 0 }}
        >
          <GridLayoutItem id="orders-api" title="Orders" header resizeable="hv" style={{ gridArea: "1/1/2/2" }}>
            <Panel label="Orders" />
          </GridLayoutItem>
          <GridLayoutStackedItem id="blotters-api" style={{ gridArea: "1/2/2/3" }} />
          <GridLayoutItem id="trades-api" title="Trades" stackId="blotters-api" header resizeable="hv" style={{ gridArea: "1/2/2/3" }}>
            <Panel label="Trades" />
          </GridLayoutItem>
          <GridLayoutItem id="positions-api" title="Positions" stackId="blotters-api" header resizeable="hv" style={{ gridArea: "1/2/2/3" }}>
            <Panel label="Positions" />
          </GridLayoutItem>
        </GridLayout>
      </div>
    </GridLayoutProvider>
  );
};
