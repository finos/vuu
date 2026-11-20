import { Button } from "@salt-ds/core";
import { useData } from "@vuu-ui/core";
import {
  buildDataColumnMapFromSchema,
  getSchema,
  Table as DataTable,
  TickingArrayDataSource,
} from "@vuu-ui/vuu-data-test";
import { TableSchema } from "@vuu-ui/vuu-data-types";
import { Table } from "@vuu-ui/vuu-table";
import { DataSourceStats, TableFooter } from "@vuu-ui/vuu-table-extras";
import { TableConfig } from "@vuu-ui/vuu-table-types";
import { toColumnName } from "@vuu-ui/vuu-utils";
import { useCallback, useMemo, useState } from "react";
import { withRemoteSubscribe } from "./remoteSubscribeDataSource";

const schema: TableSchema = {
  columns: [
    { name: "id", serverDataType: "string" },
    { name: "ric", serverDataType: "string" },
    { name: "price", serverDataType: "string" },
    { name: "quantity", serverDataType: "string" },
    { name: "currency", serverDataType: "string" },
    { name: "vuuLastUpdated", serverDataType: "epochtimestamp" },
    { name: "vuuCreated", serverDataType: "epochtimestamp" },
  ],
  key: "id",
  table: { module: "TEST", table: "TestTable" },
};

// prettier-ignore
const table = new DataTable(
    schema,
    [],
    buildDataColumnMapFromSchema(schema)
)

class Id {
  private static count = 0;
  static get next() {
    Id.count += 1;
    return `${Id.count}`.padStart(10, "0");
  }
}

const EmptyDisplay = () => "Nothing to see here";

export const LoadFromEmpty = () => {
  const dataSource = useMemo(() => {
    return new TickingArrayDataSource({
      columnDescriptors: schema.columns,
      table,
    });
  }, []);

  const config = useMemo<TableConfig>(
    () => ({
      columns: schema.columns,
      rowSeparators: true,
      zebraStripes: true,
    }),
    [],
  );

  const insertRow = useCallback(() => {
    table.insert([Id.next, "AAP.L", 100.39, 10000, "USD", 0, 0]);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ height: 32, display: "flex", gap: 12 }}>
        <Button onClick={insertRow}>Insert Row</Button>
      </div>
      <div style={{ width: 900, height: 421 }}>
        <Table
          config={config}
          dataSource={dataSource}
          EmptyDisplay={EmptyDisplay}
        />
      </div>
      <TableFooter>
        <DataSourceStats dataSource={dataSource} />
      </TableFooter>
    </div>
  );
};

const instrumentPrices = getSchema("instrumentPrices");

/**
 * A Table unmounted and remounted on the same data source before the server
 * has replied to its subscription. The data source subscribes the way a
 * remote one does, the subscription completes only when requested.
 */
export const RemountWhileSubscribing = () => {
  const { VuuDataSource } = useData();
  const [tableMounted, setTableMounted] = useState(true);
  const [completeSubscription, setCompleteSubscription] = useState<
    (() => void) | undefined
  >(undefined);

  const dataSource = useMemo(
    () =>
      withRemoteSubscribe(
        new VuuDataSource({
          columns: instrumentPrices.columns.map(toColumnName),
          table: instrumentPrices.table,
        }),
        (complete) => setCompleteSubscription(() => complete),
      ),
    [VuuDataSource],
  );

  const config = useMemo<TableConfig>(
    () => ({ columns: instrumentPrices.columns }),
    [],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <Button
          data-testid="toggle-table"
          onClick={() => setTableMounted((mounted) => !mounted)}
        >
          {tableMounted ? "Unmount table" : "Mount table"}
        </Button>
        <Button
          data-testid="complete-subscription"
          disabled={completeSubscription === undefined}
          onClick={() => {
            completeSubscription?.();
            setCompleteSubscription(undefined);
          }}
        >
          Complete subscription
        </Button>
      </div>
      {tableMounted ? (
        <Table
          config={config}
          dataSource={dataSource}
          height={400}
          renderBufferSize={10}
          width={800}
        />
      ) : null}
    </div>
  );
};
