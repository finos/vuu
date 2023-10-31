import { InstrumentPicker } from "@finos/vuu-ui-controls";
import { getAllSchemas, getSchema } from "@finos/vuu-data-test";
import { buildColumnMap, ColumnMap } from "@finos/vuu-utils";
import { useCallback, useMemo } from "react";
import { TableProps, TableRowSelectHandler } from "@finos/vuu-table";
import { createArrayDataSource } from "../utils/createArrayDataSource";
import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { useTestDataSource } from "../utils";

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
    console.log(`row selected ${row.join(",")}`);
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
