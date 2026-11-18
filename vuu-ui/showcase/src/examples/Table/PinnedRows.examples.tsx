import { Button, Switch } from "@salt-ds/core";
import { getSchema } from "@vuu-ui/vuu-data-test";
import { Table } from "@vuu-ui/vuu-table";
import type { VuuGroupBy, VuuSort } from "@vuu-ui/vuu-protocol-types";
import type {
  DataRow,
  TableConfig,
  TablePinnedRows,
  TableRowArea,
  TableRowSelectHandler,
} from "@vuu-ui/vuu-table-types";
import type { DataSourceConstructorProps } from "@vuu-ui/vuu-data-types";
import { DataProvider, toColumnName, useData } from "@vuu-ui/vuu-utils";
import {
  type ChangeEvent,
  StrictMode,
  useCallback,
  useMemo,
  useState,
} from "react";
import { withRemoteSubscribe } from "./remoteSubscribeDataSource";

const schema = getSchema("instrumentPrices");

type SelectedRow = {
  area: TableRowArea;
  key: string;
};

export interface PinnedRowsExampleProps {
  groupBy?: VuuGroupBy;
  initialMaxVisibleRows?: number;
  maxPinnedRows?: number;
  pinnedKeys?: string[];
  sort?: VuuSort;
}

const PinnedRowsTemplate = ({
  groupBy,
  initialMaxVisibleRows,
  maxPinnedRows,
  pinnedKeys: initialPinnedKeys = [],
  sort,
}: PinnedRowsExampleProps) => {
  const { VuuDataSource } = useData();
  const [pinnedKeys, setPinnedKeys] = useState<string[]>(initialPinnedKeys);
  const [pinnedRowCount, setPinnedRowCount] = useState(0);
  const [selectedRow, setSelectedRow] = useState<SelectedRow | null>(null);
  const [showPinnedRows, setShowPinnedRows] = useState(true);
  const [scrollPinnedRows, setScrollPinnedRows] = useState(
    initialMaxVisibleRows !== undefined,
  );

  const dataSource = useMemo(
    () =>
      new VuuDataSource({
        columns: schema.columns.map(toColumnName),
        groupBy,
        sort,
        table: schema.table,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [VuuDataSource],
  );

  const config = useMemo<TableConfig>(
    () => ({
      columns: [
        { name: "ric", pin: "left", width: 120 },
        { name: "description", width: 200 },
        { name: "currency" },
        { name: "exchange" },
        { name: "bid", type: { name: "number", renderer: { name: "vuu.price-move-background", flashStyle: "bg-only" } } },
        { name: "ask", type: { name: "number", renderer: { name: "vuu.price-move-background", flashStyle: "bg-only" } } },
        { name: "last", type: "number" },
        { name: "open", type: "number" },
        { name: "close", type: "number" },
        { name: "bidSize", type: "number" },
        { name: "askSize", type: "number" },
        { name: "isin", width: 140 },
        { name: "bbg" },
        { name: "lotSize", type: "number" },
        { name: "phase", pin: "right" },
      ],
      columnSeparators: true,
      rowSeparators: true,
      zebraStripes: true,
    }),
    [],
  );

  const pinnedRows = useMemo<TablePinnedRows | undefined>(
    () =>
      showPinnedRows
        ? {
            keys: pinnedKeys,
            maxPinnedRows,
            maxVisibleRows: scrollPinnedRows
              ? (initialMaxVisibleRows ?? 2)
              : undefined,
          }
        : undefined,
    [
      initialMaxVisibleRows,
      maxPinnedRows,
      pinnedKeys,
      scrollPinnedRows,
      showPinnedRows,
    ],
  );

  const handleSelect = useCallback<TableRowSelectHandler>(
    (dataRow: DataRow | null, area = "body") => {
      setSelectedRow(dataRow ? { area, key: dataRow.key } : null);
    },
    [],
  );

  const pinSelectedRow = useCallback(() => {
    if (selectedRow?.area === "body") {
      setPinnedKeys((keys) => keys.concat(selectedRow.key));
      setSelectedRow(null);
    }
  }, [selectedRow]);

  const unpinSelectedRow = useCallback(() => {
    if (selectedRow?.area === "pinned") {
      setPinnedKeys((keys) => keys.filter((key) => key !== selectedRow.key));
      setSelectedRow(null);
    }
  }, [selectedRow]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: 8,
      }}
    >
      <div style={{ alignItems: "center", display: "flex", gap: 8 }}>
        <Button
          data-testid="pin-row"
          disabled={
            selectedRow?.area !== "body" ||
            pinnedKeys.length >= (maxPinnedRows ?? 5)
          }
          onClick={pinSelectedRow}
        >
          Pin selected row
        </Button>
        <Button
          data-testid="unpin-row"
          disabled={selectedRow?.area !== "pinned"}
          onClick={unpinSelectedRow}
        >
          Unpin selected row
        </Button>
        <Button
          data-testid="unpin-all"
          disabled={pinnedKeys.length === 0}
          onClick={() => setPinnedKeys([])}
        >
          Unpin all
        </Button>
        <Switch
          checked={showPinnedRows}
          label="Show pinned rows"
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setShowPinnedRows(e.target.checked)
          }
        />
        <Switch
          checked={scrollPinnedRows}
          label="Scroll pinned rows beyond 2"
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setScrollPinnedRows(e.target.checked)
          }
        />
        <span data-testid="pinned-count">{`${pinnedRowCount} pinned`}</span>
      </div>
      <Table
        config={config}
        data-testid="table"
        dataSource={dataSource}
        height={600}
        onPinnedRowCountChange={setPinnedRowCount}
        onSelect={handleSelect}
        pinnedRows={pinnedRows}
        renderBufferSize={10}
        selectionModel="single"
        width={900}
      />
    </div>
  );
};

/**
 * Select a row and pin it. Pinned rows stay above the scrolling body, follow
 * the body sort and columns, and share a single selection with the body.
 *
 * tags=data-consumer
 */
export const PinnedRows = (props: PinnedRowsExampleProps) => (
  <PinnedRowsTemplate {...props} />
);

/**
 * More pinned rows than maxVisibleRows, the pinned area scrolls on its own.
 *
 * tags=data-consumer
 */
export const ScrollingPinnedRows = (props: PinnedRowsExampleProps) => (
  <PinnedRowsTemplate
    initialMaxVisibleRows={2}
    pinnedKeys={["AAOO.L", "AAOQ.OQ", "AAOT.PA", "AAOV.FR"]}
    {...props}
  />
);

type DataSourceConstructor = ReturnType<typeof useData>["VuuDataSource"];

const SUBSCRIBE_DELAY = 300;

/**
 * Pinned rows in StrictMode, with data sources that subscribe asynchronously,
 * as remote ones do. StrictMode runs the Table's effects twice while the
 * pinned rows data source is still subscribing.
 *
 * tags=data-consumer
 */
export const PinnedRowsStrictModeRemoteSubscribe = (
  props: PinnedRowsExampleProps,
) => {
  const { getServerAPI, VuuDataSource } = useData();
  const remoteSubscribeDataSource = useMemo(
    () =>
      function remoteSubscribeDataSource(
        constructorProps: DataSourceConstructorProps,
      ) {
        return withRemoteSubscribe(
          new VuuDataSource(constructorProps),
          (completeSubscription) =>
            setTimeout(completeSubscription, SUBSCRIBE_DELAY),
        );
      } as unknown as DataSourceConstructor,
    [VuuDataSource],
  );
  return (
    <StrictMode>
      <DataProvider
        getServerAPI={getServerAPI}
        VuuDataSource={remoteSubscribeDataSource}
      >
        <PinnedRowsTemplate pinnedKeys={["AAOO.L", "AAOQ.OQ"]} {...props} />
      </DataProvider>
    </StrictMode>
  );
};
