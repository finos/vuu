import { InstrumentPicker } from "@finos/vuu-ui-controls";
import { getSchema } from "@finos/vuu-data-test";
import { buildColumnMap, ColumnMap } from "@finos/vuu-utils";
import { useCallback, useMemo } from "react";
import { TableProps, TableRowSelectHandler } from "@finos/vuu-table";
import { createArrayDataSource } from "../utils/createArrayDataSource";
import { ColumnDescriptor } from "@finos/vuu-datagrid-types";

let displaySequence = 0;

export const DefaultInstrumentPicker = () => {
  const schema = getSchema("instruments");
  const [columnMap, searchColumns, tableProps] = useMemo<
    [ColumnMap, string[], Pick<TableProps, "config" | "dataSource">]
  >(
    () => [
      buildColumnMap(schema.columns),
      ["bbg", "description"],
      {
        config: {
          // TODO need to inject this value
          showHighlightedRow: true,
          columns: [
            { name: "bbg", serverDataType: "string" },
            { name: "description", serverDataType: "string", width: 280 },
          ] as ColumnDescriptor[],
        },
        dataSource: createArrayDataSource({ table: schema.table }),
      },
    ],
    [schema]
  );

  const handleSelect = useCallback<TableRowSelectHandler>((row) => {
    console.log(`row selected ${row.join(",")}`);
  }, []);

  return (
    <InstrumentPicker
      TableProps={tableProps}
      columnMap={columnMap}
      onSelect={handleSelect}
      schema={schema}
      searchColumns={searchColumns}
      style={{ width: 400 }}
    />
  );
};
DefaultInstrumentPicker.displaySequence = displaySequence++;
