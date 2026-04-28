import { Button } from "@salt-ds/core";
import {
  buildDataColumnMapFromSchema,
  Table as DataTable,
  TickingArrayDataSource,
} from "@vuu-ui/vuu-data-test";
import { TableSchema } from "@vuu-ui/vuu-data-types";
import { Table } from "@vuu-ui/vuu-table";
import { DataSourceStats, TableFooter } from "@vuu-ui/vuu-table-extras";
import { TableConfig } from "@vuu-ui/vuu-table-types";
import { useCallback, useMemo } from "react";

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
