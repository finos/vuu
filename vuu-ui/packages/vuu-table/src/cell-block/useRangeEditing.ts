import { type CellChange, useTableEditSession } from "@vuu-ui/vuu-data-editing";
import type { RpcResult, VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import type { DataRow, RuntimeColumnDescriptor } from "@vuu-ui/vuu-table-types";
import {
  dataDescriptorTypeToVuuRowDataItemType,
  getTypedValue,
  isDataValueEditable,
} from "@vuu-ui/vuu-utils";
import { type RefObject, useCallback } from "react";
import type { TableCellBlock } from "./cellblock-utils";

export interface RangeEditingHookProps {
  columns: readonly RuntimeColumnDescriptor[];
  dataRowsRef: RefObject<readonly DataRow[]>;
  headerCount: number;
  /** The key column of the data source, which a block edit never sets. */
  keyColumn?: string;
}

/** The value to set, typed for the column. Throws when it isn't valid. */
const typedValue = (
  column: RuntimeColumnDescriptor,
  value: string,
): VuuRowDataItemType => {
  const check = column.clientSideEditValidationCheck?.(value, "*");
  if (check?.ok === false) {
    throw Error(
      check.messages?.join(",") ?? `invalid value for ${column.name}`,
    );
  }
  return getTypedValue(
    value,
    column.serverDataType ?? dataDescriptorTypeToVuuRowDataItemType(column),
    true,
  ) as VuuRowDataItemType;
};

/**
 * Edits every editable cell of a cell block as one change, setting each to
 * the same value. Cells of unique columns, the key column among them, are
 * left as they are.
 */
export const useRangeEditing = ({
  columns,
  dataRowsRef,
  headerCount,
  keyColumn,
}: RangeEditingHookProps) => {
  const editSession = useTableEditSession();

  const blockColumns = useCallback(
    ({ columnRange }: TableCellBlock) =>
      columns.filter(
        ({ ariaColIndex, ...column }) =>
          ariaColIndex >= columnRange.from &&
          ariaColIndex <= columnRange.to &&
          !column.unique &&
          column.name !== keyColumn &&
          isDataValueEditable(column, "update"),
      ),
    [columns, keyColumn],
  );

  /** True when the block has a cell that can be edited. */
  const isRangeEditable = useCallback(
    (cellBlock: TableCellBlock) =>
      editSession !== undefined && blockColumns(cellBlock).length > 0,
    [blockColumns, editSession],
  );

  const editRange = useCallback(
    async (cellBlock: TableCellBlock, value: string): Promise<RpcResult> => {
      if (editSession === undefined) {
        return { errorMessage: "Not editing", type: "ERROR_RESULT" };
      }
      if (value.trim() === "") {
        return { errorMessage: "Enter a value", type: "ERROR_RESULT" };
      }
      const { rowRange } = cellBlock;
      const blockRows = (dataRowsRef.current ?? []).filter(({ index }) => {
        const ariaRowIndex = index + headerCount + 1;
        return ariaRowIndex >= rowRange.from && ariaRowIndex <= rowRange.to;
      });

      const edits: CellChange[] = [];
      try {
        for (const column of blockColumns(cellBlock)) {
          const newValue = typedValue(column, value);
          for (const dataRow of blockRows) {
            const previous = dataRow[column.name];
            if (previous !== newValue) {
              edits.push({
                key: dataRow.key,
                column: column.name,
                previous,
                value: newValue,
              });
            }
          }
        }
      } catch (error) {
        return {
          errorMessage: (error as Error).message,
          type: "ERROR_RESULT",
        };
      }
      return editSession.commitChange(edits);
    },
    [blockColumns, dataRowsRef, editSession, headerCount],
  );

  return { editRange, isRangeEditable };
};
