import { getSchema, SimulTableName, vuuModule } from "@finos/vuu-data-test";
import { Table, TableProps } from "@finos/vuu-table";
import { useCallback, useMemo } from "react";

import "./Table.examples.css";

let displaySequence = 1;

export const CheckboxSelection = () => {
  const tableProps = useMemo<
    Pick<TableProps, "config" | "dataSource" | "selectionModel">
  >(() => {
    const tableName: SimulTableName = "instruments";
    return {
      config: {
        columns: getSchema(tableName).columns,
        rowSeparators: true,
        zebraStripes: true,
      },
      dataSource:
        vuuModule<SimulTableName>("SIMUL").createDataSource(tableName),
      selectionModel: "checkbox",
    };
  }, []);

  const onSelect = useCallback((row) => {
    console.log("onSelect", { row });
  }, []);
  const onSelectionChange = useCallback((selected) => {
    console.log("onSelectionChange", { selected });
  }, []);

  return (
    <Table
      {...tableProps}
      height={645}
      navigationStyle="row"
      renderBufferSize={5}
      onSelect={onSelect}
      onSelectionChange={onSelectionChange}
      width={723}
    />
  );
};
CheckboxSelection.displaySequence = displaySequence++;
