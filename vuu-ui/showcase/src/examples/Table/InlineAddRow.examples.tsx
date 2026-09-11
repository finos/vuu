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
  columns: schema.columns.map((col) =>
    col.name === "vuuCreatedTimestamp" ||
    col.name === "vuuUpdatedTimestamp" ||
    col.name === "vuuMsg"
      ? col
      : { ...col, editable: true }
  ),
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
  const keepEditSessionOpen = useCallback(() => undefined, []);
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

const InlineAddRowWithServerRejectionTable = () => {
  const { VuuDataSource } = useData();
  const sourceDataSource = useMemo(() => {
    const ds = new VuuDataSource({ table: schema.table });
    const originalCreateSessionDataSource = (ds.createSessionDataSource as any)?.bind(ds);
    if (originalCreateSessionDataSource) {
      ds.createSessionDataSource = async (...args: any[]) => {
        const sessionDs = await originalCreateSessionDataSource(...args);
        if (sessionDs) {
          const originalAddRow = sessionDs.addRow?.bind(sessionDs);
          sessionDs.addRow = async (rowData: Record<string, any> = {}) => {
            if (rowData["ric"] === "ERROR") {
              return {
                type: "ERROR_RESULT",
                errorMessage: "Simulated server rejection: RIC cannot be 'ERROR'",
              };
            }
            return originalAddRow
              ? originalAddRow(rowData)
              : { type: "SUCCESS_RESULT", data: undefined };
          };
        }
        return sessionDs;
      };
    }
    return ds;
  }, [VuuDataSource]);

  const keepEditSessionOpen = useCallback(() => undefined, []);
  const { dataSource, editSession } = useEditableTable({
    copyOption: "Empty",
    dataSource: sourceDataSource,
    isEditMode: true,
    onCancel: keepEditSessionOpen,
    onSave: keepEditSessionOpen,
  });

  return (
    <DataEditingProvider editSession={editSession}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--salt-spacing-100)" }}>
        <p style={{ padding: "0 var(--salt-spacing-100)", color: "var(--salt-content-primary-foreground)", margin: 0 }}>
          <strong>Testing tip:</strong> Enter <code>ERROR</code> in the <code>ric</code> column editor and commit the row to trigger a simulated server rejection. Any other values will succeed normally.
        </p>
        <Table
          config={tableConfig}
          customHeader={InlineAddRowHeader}
          dataSource={dataSource}
          height={600}
          renderBufferSize={10}
          width={920}
        />
      </div>
    </DataEditingProvider>
  );
};

/** tags=data-consumer */
export const InlineAddRowWithServerRejection = () => (
  <LocalDataSourceProvider>
    <InlineAddRowWithServerRejectionTable />
  </LocalDataSourceProvider>
);
