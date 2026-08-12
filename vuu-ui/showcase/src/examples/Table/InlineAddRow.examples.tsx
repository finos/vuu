import {
  DataEditingProvider,
  useEditableTable,
} from "@vuu-ui/vuu-data-editing";
import { LocalDataSourceProvider, getSchema } from "@vuu-ui/vuu-data-test";
import { SchemaColumn } from "@vuu-ui/vuu-data-types";
import { Table } from "@vuu-ui/vuu-table";
import { InlineAddRow as InlineAddRowHeader } from "@vuu-ui/vuu-table-extras";
import type { ColumnDescriptor, TableConfig } from "@vuu-ui/vuu-table-types";
import { useData } from "@vuu-ui/vuu-utils";
import { useCallback, useMemo } from "react";

const schema = getSchema("instruments");

const asEditable = (columns: readonly SchemaColumn[]): ColumnDescriptor[] => {
  return columns.map<ColumnDescriptor>(({ editable, name, serverDataType }) => (
    name === 'currency' ? {
      editable,
      name,
      serverDataType,
      type: {
        name: "string",
        renderer: {
          name: "dropdown-cell",
          values: [
            "CAD",
            "EUR",
            "GBP",
            "GBX",
            "JPY",
            "SEK",
            "USD",
          ],
        }
      }
    }
      : {
        editable,
        name,
        serverDataType
      }))
}

const tableConfig: TableConfig = {
  columns: asEditable(schema.columns),
  columnDefaultWidth: 120,
  rowSeparators: true,
  zebraStripes: true,
};

const InlineAddRowTable = () => {
  const { VuuDataSource } = useData();
  const sourceDataSource = useMemo(
    () => new VuuDataSource({ table: schema.table }),
    [VuuDataSource],
  );
  const keepEditSessionOpen = useCallback(() => { }, []);
  const { dataSource, editSession } = useEditableTable({
    copyOption: "Empty",
    dataSource: sourceDataSource,
    isEditMode: true,
    onCancel: keepEditSessionOpen,
    onSave: keepEditSessionOpen,
  });

  return (
    <DataEditingProvider editSession={editSession}>
      <Table
        config={tableConfig}
        customHeader={InlineAddRowHeader}
        dataSource={dataSource}
        height={645}
        renderBufferSize={10}
        width={1100}
      />
    </DataEditingProvider>
  );
};

/** tags=data-consumer */
export const InlineAddRow = () => (
  <LocalDataSourceProvider>
    <InlineAddRowTable />
  </LocalDataSourceProvider>
);
