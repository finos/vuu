import { Button, FlexLayout, Text } from "@salt-ds/core";
import {
  GridLayout,
  GridLayoutItem,
  GridLayoutProvider,
  GridLayoutStackedItem,
  useGridLayoutCommands,
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

/**
 * Maximise from an item's header, a stack's tab strip, or by double-clicking
 * a header. Restore, double-click again or press Escape to put the grid
 * back. "Fixed" opts out; the nested grid maximises within its own cell.
 */
export const MaximiseItems = () => (
  // prettier-ignore
  <GridLayout
    colsAndRows={{ cols: ["1fr", "1fr"], rows: ["1fr", "1fr"] }}
    full-page
    id="maximise-items"
    maximisable
  >
    <GridLayoutItem id="orders" title="Orders" header resizeable="hv" style={{ gridArea: "1/1/2/2" }}>
      <Panel label="Orders" />
    </GridLayoutItem>
    <GridLayoutStackedItem id="blotters" style={{ gridArea: "1/2/2/3" }} />
    <GridLayoutItem id="trades" title="Trades" stackId="blotters" header resizeable="hv" style={{ gridArea: "1/2/2/3" }}>
      <Panel label="Trades" />
    </GridLayoutItem>
    <GridLayoutItem id="positions" title="Positions" stackId="blotters" header resizeable="hv" style={{ gridArea: "1/2/2/3" }}>
      <Panel label="Positions" />
    </GridLayoutItem>
    <GridLayoutItem id="fixed" title="Fixed" maximisable={false} header resizeable="hv" style={{ gridArea: "2/1/3/2" }}>
      <Panel label="Can't be maximised" />
    </GridLayoutItem>
    <GridLayoutItem id="nested-host" title="Nested grid" header resizeable="hv" style={{ gridArea: "2/2/3/3" }}>
      <GridLayout
        colsAndRows={{ cols: ["1fr", "1fr"], rows: ["1fr"] }}
        id="maximise-nested"
        maximisable
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

const MaximiseToolbar = ({ maximisedId }: { maximisedId?: string }) => {
  const commands = useGridLayoutCommands("maximise-from-code");
  return (
    <FlexLayout align="center" gap={1} padding={1}>
      <Button onClick={() => commands?.maximise("orders-api")}>
        Maximise Orders
      </Button>
      <Button onClick={() => commands?.maximise("positions-api")}>
        Maximise Positions stack
      </Button>
      <Button disabled={!maximisedId} onClick={() => commands?.restore()}>
        Restore
      </Button>
      <Text>Maximised: {maximisedId ?? "none"}</Text>
    </FlexLayout>
  );
};

/**
 * Maximise and restore through useGridLayoutCommands. onMaximisedChange
 * keeps the toolbar in step, including when an item is maximised from its
 * header.
 */
export const MaximiseFromCode = () => {
  const [maximisedId, setMaximisedId] = useState<string>();
  const handleMaximisedChange = useCallback((id: string | undefined) => {
    setMaximisedId(id);
  }, []);
  return (
    <GridLayoutProvider>
      <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
        <MaximiseToolbar maximisedId={maximisedId} />
        {/* prettier-ignore */}
        <GridLayout
          colsAndRows={{ cols: ["1fr", "1fr"], rows: ["1fr"] }}
          id="maximise-from-code"
          maximisable
          onMaximisedChange={handleMaximisedChange}
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
