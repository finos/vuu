import { buildValidationChecker } from "@vuu-ui/vuu-data-react";
import { VuuRpcServiceRequest } from "@vuu-ui/vuu-protocol-types";
import {
  DataCellEditNotification,
  DataValueTypeDescriptor,
  TableConfig,
} from "@vuu-ui/vuu-table-types";
import {
  hasValidationRules,
  isTypeDescriptor,
  metadataKeys,
} from "@vuu-ui/vuu-utils";
import { useCallback, useMemo, useRef, useState } from "react";
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

const { IDX } = metadataKeys;

type ErrorTuple = [number, string];

const isRecorded = (index: ErrorTuple, record: ErrorTuple[]) => {
  for (const r of record) {
    if (isSameArray(r, index)) {
      return true;
    }
  }
  return false;
};

const isSameArray = (arr1: ErrorTuple, arr2: ErrorTuple) => {
  return arr1[0] == arr2[0] && arr1[1] == arr2[1];
};

export type BulkEditPanelHookProps = Pick<
  BulkEditPanelProps,
  "columns" | "sessionDs" | "onValidationStatusChange"
>;

export const useBulkEditPanel = ({
  columns,
  sessionDs: dataSource,
  onValidationStatusChange,
}: BulkEditPanelHookProps) => {
  const errorsRef = useRef<ErrorTuple[]>([]);
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

  const handleDataEdited = useCallback<DataCellEditNotification>(
    ({ isValid = true, row, columnName }) => {
      if (columnName && row) {
        if (
          !isValid &&
          !isRecorded([row[IDX], columnName], errorsRef.current)
        ) {
          errorsRef.current.push([row[IDX], columnName]);
        } else if (
          isValid &&
          isRecorded([row[IDX], columnName], errorsRef.current)
        ) {
          errorsRef.current = errorsRef.current.filter(
            (error) => !isSameArray(error, [row[IDX], columnName]),
          );
        }
        if (rowState === true && errorsRef.current.length === 0) {
          onValidationStatusChange(true);
        } else {
          onValidationStatusChange(false);
        }
      }
    },
    [onValidationStatusChange, rowState],
  );

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
    onDataEdited: handleDataEdited,
    onRowChange: handleRowChange,
  };
};
