import { SimulTableName, getSchema, vuuModule } from "@finos/vuu-data-test";
import { Table, TableProps } from "@finos/vuu-table";
import { FlexLayout } from "@salt-ds/core";
import { useMemo } from "react";

let displaySequence = 0;

const { columns } = getSchema("instruments");

type SimpleTableProps = Pick<TableProps, "config" | "dataSource">;

export const SyncedSelection = () => {
  const [tableProps1, tableProps2] = useMemo<
    [SimpleTableProps, SimpleTableProps]
  >(() => {
    const tableName: SimulTableName = "instruments";
    const ds1 = vuuModule<SimulTableName>("SIMUL").createDataSource(tableName);
    const ds2 = vuuModule<SimulTableName>("SIMUL").createDataSource(tableName);

    ds2.sendBroadcastMessage({
      sourceId: ds2.viewport,
      type: "subscribe-link-select",
      targetId: ds1.viewport,
      targetColumn: "ric",
    });

    return [
      { config: { columns }, dataSource: ds1 },
      { config: { columns }, dataSource: ds2 },
    ];
  }, []);

  return (
    <FlexLayout style={{ flexDirection: "column" }}>
      <Table {...tableProps1} height={400} width={723} />
      <Table {...tableProps2} height={400} width={723} />
    </FlexLayout>
  );
};
SyncedSelection.displaySequence = displaySequence++;

export const SyncedFilter = () => {
  const [tableProps1, tableProps2] = useMemo<
    [SimpleTableProps, SimpleTableProps]
  >(() => {
    const tableName: SimulTableName = "instruments";
    const ds1 = vuuModule<SimulTableName>("SIMUL").createDataSource(tableName);
    const ds2 = vuuModule<SimulTableName>("SIMUL").createDataSource(tableName);

    ds2.sendBroadcastMessage({
      sourceId: ds2.viewport,
      type: "subscribe-link-filter",
      targetId: ds1.viewport,
      targetColumn: "ric",
    });

    return [
      { config: { columns }, dataSource: ds1 },
      { config: { columns }, dataSource: ds2 },
    ];
  }, []);

  return (
    <FlexLayout style={{ flexDirection: "column" }}>
      <Table {...tableProps1} height={400} width={723} />
      <Table {...tableProps2} height={400} width={723} />
    </FlexLayout>
  );
};
SyncedFilter.displaySequence = displaySequence++;
