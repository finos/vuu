import {
  DataEditingProvider,
  useEditableTable,
} from "@vuu-ui/vuu-data-editing";
import { LocalDataSourceProvider, getSchema } from "@vuu-ui/vuu-data-test";
import { Table } from "@vuu-ui/vuu-table";
import { InlineAddRow as InlineAddRowHeader } from "@vuu-ui/vuu-table-extras";
import type { TableConfig } from "@vuu-ui/vuu-table-types";
import { useData } from "@vuu-ui/vuu-utils";
import { useCallback, useMemo } from "react";

const schema = getSchema("instruments");

const tableConfig: TableConfig = {
  columns: schema.columns,
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
  const keepEditSessionOpen = useCallback(() => {}, []);
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
        width={920}
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
