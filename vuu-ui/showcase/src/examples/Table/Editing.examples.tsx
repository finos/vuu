import { ToggleButton, ToggleButtonGroup } from "@salt-ds/core";
import { getSchema, LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";
import type { VuuTable } from "@vuu-ui/vuu-protocol-types";
import { Table } from "@vuu-ui/vuu-table";
import { DataSourceStats, TableFooter } from "@vuu-ui/vuu-table-extras";
import { TableConfig } from "@vuu-ui/vuu-table-types";
import { DataEditingProvider, useEditableTable } from "@vuu-ui/vuu-utils";
import { EditButtons } from "@vuu-ui/vuu-utils/src/data-editing/EditButtons";
import { useMemo } from "react";

const INSTRUMENTS = { module: "SIMUL", table: "instruments" };
const schema = getSchema("instruments");

const EditTableTemplate = ({ vuuTable }: { vuuTable: VuuTable }) => {
  const {
    dataSource,
    editMode,
    editTracker,
    onCancel,
    onSave,
    onToggleEditMode,
  } = useEditableTable({
    table: vuuTable,
  });
  const config = useMemo<TableConfig>(
    () => ({
      columns:
        editMode === "view"
          ? schema.columns
          : schema.columns.map((col) => ({ ...col, editable: true })),
      columnDefaultWidth: 150,
      rowSeparators: true,
      zebraStripes: true,
    }),
    [editMode],
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: 1500,
        height: 285,
      }}
    >
      <div
        style={{
          alignItems: "center",
          display: "flex",
          background: "var(--salt-container-secondary-background)",
          flex: "0 0 32px",
          padding: "0 var(--salt-spacing-100)",
        }}
      >
        <ToggleButtonGroup onChange={onToggleEditMode} value={editMode}>
          <ToggleButton value="view">View</ToggleButton>
          <ToggleButton value="edit">Edit</ToggleButton>
        </ToggleButtonGroup>
      </div>
      <div style={{ flex: "1 1 auto" }}>
        <DataEditingProvider editTracker={editTracker}>
          <Table config={config} dataSource={dataSource} renderBufferSize={0} />
        </DataEditingProvider>
      </div>
      <TableFooter>
        {editMode === "view" ? (
          <DataSourceStats dataSource={dataSource} />
        ) : (
          <EditButtons
            editTracker={editTracker}
            onCancel={onCancel}
            onSave={onSave}
          />
        )}
      </TableFooter>
    </div>
  );
};

export const EditableInstruments = () => {
  return (
    <LocalDataSourceProvider>
      <EditTableTemplate vuuTable={INSTRUMENTS} />
      <EditTableTemplate vuuTable={INSTRUMENTS} />
    </LocalDataSourceProvider>
  );
};
