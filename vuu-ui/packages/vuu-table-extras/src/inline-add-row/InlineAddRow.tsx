import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import {
  useEditSession,
  withDataRowEditErrors,
} from "@vuu-ui/vuu-data-editing";
import type { RpcResult } from "@vuu-ui/vuu-protocol-types";
import { Row } from "@vuu-ui/vuu-table";
import type {
  BaseRowProps,
  DataRow,
  EditEventState,
  RuntimeColumnDescriptor,
  TableCellEditHandler,
} from "@vuu-ui/vuu-table-types";
import { getCellRenderer, isNotHidden, isRpcError } from "@vuu-ui/vuu-utils";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  getMissingValueErrors,
  type InlineAddRowErrors,
  type InlineAddRowValues,
} from "./inline-add-row-utils";

import inlineAddRowCss from "./InlineAddRow.css";

const classBase = "vuuInlineAddRow";
const syntheticRowKey = "inline-add-row";

const editSucceeded: RpcResult = { data: undefined, type: "SUCCESS_RESULT" };

const createSyntheticDataRow = (
  values: InlineAddRowValues,
  columns: RuntimeColumnDescriptor[],
  errors: InlineAddRowErrors,
): DataRow =>
  withDataRowEditErrors(
    {
      ...values,
      childCount: 0,
      depth: 1,
      hasColumn: (name: string) =>
        columns.some((column) => column.name === name),
      index: -1,
      isExpanded: false,
      isLeaf: true,
      isSelected: false,
      key: syntheticRowKey,
      renderIndex: -1,
    } as DataRow,
    errors,
  );

const createEditError = (errorMessage: string): RpcResult => ({
  errorMessage,
  type: "ERROR_RESULT",
});

export interface InlineAddRowProps extends BaseRowProps {}

export const InlineAddRow = ({
  ariaRowIndex,
  className,
  columns,
  style,
  virtualColSpan = 0,
}: InlineAddRowProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-inline-add-row",
    css: inlineAddRowCss,
    window: targetWindow,
  });

  const editSession = useEditSession(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const submittingRef = useRef(false);
  const [errorMessages, setErrorMessages] = useState<InlineAddRowErrors>({});
  const [values, setValues] = useState<InlineAddRowValues>({});

  const editableColumns = useMemo(
    () =>
      columns.map((column) => {
        const editableColumn = {
          ...column,
          editable: true,
        };
        return {
          ...editableColumn,
          CellRenderer: getCellRenderer(editableColumn),
        };
      }),
    [columns],
  );
  const visibleColumns = useMemo(
    () => editableColumns.filter(isNotHidden),
    [editableColumns],
  );
  const dataRow = useMemo(
    () => createSyntheticDataRow(values, editableColumns, errorMessages),
    [editableColumns, errorMessages, values],
  );

  const focusEditor = useCallback((index: number) => {
    const cell =
      containerRef.current?.querySelectorAll<HTMLElement>("[data-field]")[
        index
      ];
    cell?.querySelector<HTMLElement>("input, button, [tabindex]")?.focus();
  }, []);

  const commitRow = useCallback(
    async (
      nextValues: InlineAddRowValues,
      fieldErrors: InlineAddRowErrors,
    ): Promise<RpcResult> => {
      const missingErrors = getMissingValueErrors(
        visibleColumns.map(({ name }) => name),
        nextValues,
      );
      const nextErrors = { ...fieldErrors, ...missingErrors };

      if (Object.keys(nextErrors).length > 0) {
        setErrorMessages(nextErrors);
        const firstInvalidIndex = visibleColumns.findIndex(
          ({ name }) => nextErrors[name] !== undefined,
        );
        focusEditor(firstInvalidIndex);
        const errorMessage =
          nextErrors[visibleColumns.at(-1)?.name ?? ""] ?? "Value required";
        return createEditError(errorMessage);
      }

      if (submittingRef.current) {
        return editSucceeded;
      }
      submittingRef.current = true;

      try {
        const response = await editSession.addRow(nextValues);
        if (isRpcError(response)) {
          const finalColumn = visibleColumns.at(-1);
          if (finalColumn) {
            setErrorMessages({
              [finalColumn.name]: response.errorMessage,
            });
          }
          return response;
        }
        setErrorMessages({});
        setValues({});
        return response;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unable to add row";
        const finalColumn = visibleColumns.at(-1);
        if (finalColumn) {
          setErrorMessages({
            [finalColumn.name]: errorMessage,
          });
        }
        return createEditError(errorMessage);
      } finally {
        submittingRef.current = false;
      }
    },
    [editSession, focusEditor, visibleColumns],
  );

  const handleDataItemEdited = useCallback<TableCellEditHandler>(
    async (editState: EditEventState, editPhase) => {
      const { columnName, isValid, value } = editState;
      const columnIndex = visibleColumns.findIndex(
        ({ name }) => name === columnName,
      );

      if (columnName === undefined || columnIndex === -1) {
        return editSucceeded;
      }

      if (editPhase === "change") {
        setValues((current) => ({ ...current, [columnName]: value }));
        setErrorMessages((current) => {
          const nextErrors = { ...current };
          delete nextErrors[columnName];
          return nextErrors;
        });
        return;
      }

      const rawValue = value.toString();
      const isEmptyValue = rawValue.trim() === "";
      if (isValid === false && !isEmptyValue) {
        return createEditError("Invalid value");
      }

      const nextValues = { ...values, [columnName]: value };
      const nextErrors = { ...errorMessages };
      delete nextErrors[columnName];
      setValues(nextValues);
      setErrorMessages(nextErrors);

      if (columnIndex === visibleColumns.length - 1) {
        return commitRow(nextValues, nextErrors);
      }

      focusEditor(columnIndex + 1);
      return editSucceeded;
    },
    [commitRow, errorMessages, focusEditor, values, visibleColumns],
  );

  return (
    <div ref={containerRef}>
      <Row
        ariaRowIndex={ariaRowIndex}
        className={[classBase, className].filter(Boolean).join(" ")}
        columns={editableColumns}
        dataRow={dataRow}
        offset={0}
        onDataEdited={handleDataItemEdited}
        searchPattern=""
        showBookends={false}
        style={style}
        virtualColSpan={virtualColSpan}
      />
    </div>
  );
};
