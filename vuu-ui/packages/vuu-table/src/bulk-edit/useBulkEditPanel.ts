import { buildValidationChecker } from "@vuu-ui/vuu-data-react";
import { VuuRpcServiceRequest } from "@vuu-ui/vuu-protocol-types";
import { DataValueTypeDescriptor, TableConfig } from "@vuu-ui/vuu-table-types";
import { hasValidationRules, isTypeDescriptor } from "@vuu-ui/vuu-utils";
import { useCallback, useMemo, useState } from "react";
import type { BulkEditPanelProps } from "./BulkEditPanel";
import { EditValueChangeHandler } from "./useBulkEditRow";

const addRenderer = (
  colType: DataValueTypeDescriptor,
  rendererName: string,
): DataValueTypeDescriptor => {
  return {
    name: colType.name,
    rules: colType.rules,
    formatting: colType.formatting,
    renderer: { name: rendererName },
  };
};

export type BulkEditPanelHookProps = Pick<
  BulkEditPanelProps,
  "columns" | "sessionDs"
>;

export const useBulkEditPanel = ({
  columns,
  sessionDs: dataSource,
}: BulkEditPanelHookProps) => {
  const [rowState, setRowState] = useState(true);

  const tableConfig: TableConfig = useMemo(() => {
    return {
      columns: columns
        ? columns.map((col) => {
            return {
              editable: col.editableBulk === "bulk",
              hidden: col.editableBulk === false,
              name: col.name,
              serverDataType: col.serverDataType ?? "string",
              type: isTypeDescriptor(col.type)
                ? addRenderer(col.type, "input-cell")
                : "string",
              clientSideEditValidationCheck: hasValidationRules(col.type)
                ? buildValidationChecker(col.type.rules)
                : undefined,
              width: 120,
            };
          })
        : dataSource.columns.map((name) => ({
            editable: true,
            name,
            serverDataType: "string",
          })),
      columnLayout: "fit",
      columnDefaultWidth: 100,
      rowSeparators: true,
    };
  }, [columns, dataSource.columns]);

  const handleRowChange = useCallback(
    (isValid: boolean) => {
      if (isValid !== rowState) {
        setRowState(isValid);
      }
    },
    [rowState],
  );

  const handleBulkChange: EditValueChangeHandler = useCallback(
    async (column, value) => {
      const response = await dataSource.rpcRequest?.({
        params: { column: column.name, value },
        rpcName: "VP_BULK_EDIT_COLUMN_CELLS_RPC",
        type: "RPC_REQUEST",
      } as Omit<VuuRpcServiceRequest, "context">);
      console.log({ response });
    },
    [dataSource],
  );

  return {
    tableConfig,
    onBulkChange: handleBulkChange,
    // onDataEdited: handleDataEdited,
    onRowChange: handleRowChange,
  };
};
