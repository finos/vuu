import {
  getAllSchemas,
  getSchema,
  SimulTableName,
  vuuModule,
} from "@finos/vuu-data-test";
import type { DataSourceRowObject } from "@finos/vuu-data-types";
import type { TableProps } from "@finos/vuu-table";
import type {
  ColumnDescriptor,
  TableRowSelectHandler,
} from "@finos/vuu-table-types";
import { InstrumentPicker } from "@finos/vuu-ui-controls";
import { buildColumnMap, ColumnMap } from "@finos/vuu-utils";
import { useCallback, useMemo } from "react";
import { useTestDataSource } from "../utils";

let displaySequence = 0;

export const DefaultInstrumentPicker = () => {
  const tableName: SimulTableName = "instruments";
  const schema = getSchema(tableName);

  const [tableProps, columnMap, searchColumns] = useMemo<
    [Pick<TableProps, "config" | "dataSource">, ColumnMap, string[]]
  >(() => {
    return [
      {
        config: {
          columns: schema.columns,
          rowSeparators: true,
          zebraStripes: true,
        },
        dataSource:
          vuuModule<SimulTableName>("SIMUL").createDataSource(tableName),
      },
      buildColumnMap(schema.columns),
      ["bbg", "description"],
    ];
  }, [schema.columns]);

  const itemToString = useCallback((row: DataSourceRowObject) => {
    return String(row.data.description);
  }, []);

  const handleSelect = useCallback<TableRowSelectHandler>((row) => {
    if (row) {
      console.log(`row selected ${row.key}`);
    }
  }, []);

  return (
    <InstrumentPicker
      TableProps={tableProps}
      columnMap={columnMap}
      itemToString={itemToString}
      onSelect={handleSelect}
      schema={schema}
      searchColumns={searchColumns}
      style={{ width: 400 }}
    />
  );
};
DefaultInstrumentPicker.displaySequence = displaySequence++;

export const InstrumentPickerVuuInstruments = () => {
  const schemas = getAllSchemas();
  const { dataSource, error } = useTestDataSource({
    // bufferSize: 1000,
    schemas,
  });

  const columnMap = buildColumnMap(dataSource.columns);

  const [searchColumns, tableProps] = useMemo<
    [string[], Pick<TableProps, "config" | "dataSource">]
  >(
    () => [
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
        dataSource,
      },
    ],
    [dataSource]
  );

  const handleSelect = useCallback<TableRowSelectHandler>((row) => {
    if (row) {
      console.log(`row selected ${Object.values(row.data).join(",")}`);
    }
  }, []);

  if (error) {
    return error;
  }

  return (
    <InstrumentPicker
      TableProps={tableProps}
      columnMap={columnMap}
      onSelect={handleSelect}
      schema={schemas.instruments}
      searchColumns={searchColumns}
      style={{ width: 400 }}
    />
  );
};
InstrumentPickerVuuInstruments.displaySequence = displaySequence++;
