import { LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";
import { Table } from "@vuu-ui/vuu-table";
import { useBulkEditDialog } from "@vuu-ui/vuu-table-extras";
import { ModalProvider } from "@vuu-ui/vuu-ui-controls";
import { useData } from "@vuu-ui/vuu-utils";
import { Button } from "@salt-ds/core";
import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { useEffect, useMemo, useState } from "react";
import {
  INSTRUMENTS,
  instrumentColumnNames,
  instrumentColumns,
  instrumentsTableConfig,
} from "./instruments";

// The key column is shown but not editable, vuuMsg is hidden.
const bulkEditColumns: ColumnDescriptor[] = instrumentColumns.map((column) => ({
  ...column,
  editableBulk:
    column.name === "vuuMsg" ? false : column.name === "ric" ? undefined : "bulk",
}));
const bulkEditPanelProps = { columns: bulkEditColumns };

const BulkEditTemplate = () => {
  const { VuuDataSource } = useData();
  const dataSource = useMemo(
    () =>
      new VuuDataSource({
        columns: instrumentColumnNames,
        table: INSTRUMENTS,
      }),
    [VuuDataSource],
  );
  const [selectedCount, setSelectedCount] = useState(0);
  useEffect(() => {
    dataSource.on("row-selection", setSelectedCount);
    return () => {
      dataSource.removeListener("row-selection", setSelectedCount);
    };
  }, [dataSource]);
  const { editSelectedRows, insertRows, isEditing } = useBulkEditDialog({
    bulkEditPanelProps,
    dataSource,
    title: "Edit instruments",
  });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <Button
          disabled={isEditing || selectedCount === 0}
          onClick={editSelectedRows}
        >
          Edit {selectedCount} selected rows
        </Button>
        <Button disabled={isEditing} onClick={insertRows}>
          Add rows
        </Button>
      </div>
      <div style={{ height: 400, width: 900 }}>
        <Table
          config={instrumentsTableConfig}
          dataSource={dataSource}
          selectionModel="checkbox"
        />
      </div>
    </div>
  );
};

/**
 * Pattern 9. Bulk edit. Select rows, then edit them together in a dialog.
 * Edits are staged in a session table and applied on Save.
 */
export const BulkEditDialog = () => (
  <LocalDataSourceProvider>
    <ModalProvider>
      <BulkEditTemplate />
    </ModalProvider>
  </LocalDataSourceProvider>
);
