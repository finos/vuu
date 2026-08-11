import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import type { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import type { BaseRowProps } from "@vuu-ui/vuu-table-types";
import { VuuInput } from "@vuu-ui/vuu-ui-controls";
import {
  getTypedValue,
  isNotHidden,
  isRpcError,
  type CommitHandler,
} from "@vuu-ui/vuu-utils";
import { useCallback, useId, useMemo, useRef, useState } from "react";
import { useEditSession } from "./DataEditingProvider";
import {
  getMissingValueErrors,
  type InlineAddRowErrors,
  type InlineAddRowValues,
} from "./inline-add-row-utils";

import inlineAddRowCss from "./InlineAddRow.css";

const classBase = "vuuInlineAddRow";

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
  const errorIdPrefix = useId();
  const submittingRef = useRef(false);
  const [errorMessages, setErrorMessages] = useState<InlineAddRowErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [values, setValues] = useState<InlineAddRowValues>({});
  const visibleColumns = useMemo(() => columns.filter(isNotHidden), [columns]);

  const focusInput = useCallback((index: number) => {
    const inputs = containerRef.current?.querySelectorAll("input");
    inputs?.item(index).focus();
  }, []);

  const commitRow = useCallback(
    async (nextValues: InlineAddRowValues, fieldErrors: InlineAddRowErrors) => {
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
        focusInput(firstInvalidIndex);
        return;
      }

      if (submittingRef.current) {
        return;
      }
      submittingRef.current = true;
      setSubmitting(true);

      try {
        const response = await editSession.addRow(nextValues);
        if (isRpcError(response)) {
          const finalColumn = visibleColumns.at(-1);
          if (finalColumn) {
            setErrorMessages({
              [finalColumn.name]: response.errorMessage,
            });
          }
          return;
        }
        setErrorMessages({});
        setValues({});
        setValues({});
      } catch (error) {
        const finalColumn = visibleColumns.at(-1);
        if (finalColumn) {
          setErrorMessages({
            [finalColumn.name]:
              error instanceof Error ? error.message : "Unable to add row",
          });
        }
      } finally {
        submittingRef.current = false;
        setSubmitting(false);
      }
    },
    [editSession, focusInput, visibleColumns],
  );

  const handleCommit = useCallback(
    (columnIndex: number): CommitHandler<HTMLElement> =>
      (_evt, value) => {
        const column = visibleColumns[columnIndex];
        const rawValue = value.toString();
        if (rawValue.trim() === "") {
          const nextValues = { ...values, [column.name]: rawValue };
          setValues(nextValues);
          if (columnIndex === visibleColumns.length - 1) {
            void commitRow(nextValues, errorMessages);
          } else {
            focusInput(columnIndex + 1);
          }
          return;
        }

        const validation = column.clientSideEditValidationCheck?.(
          rawValue,
          "*",
        );

        if (validation?.ok === false) {
          setErrorMessages((current) => ({
            ...current,
            [column.name]: validation.messages.join("\n"),
          }));
          return;
        }

        let typedValue: VuuRowDataItemType;
        try {
          typedValue = getTypedValue(
            rawValue,
            column.serverDataType ?? "string",
            true,
          );
        } catch (error) {
          setErrorMessages((current) => ({
            ...current,
            [column.name]:
              error instanceof Error ? error.message : "Invalid value",
          }));
          return;
        }

        const nextValues = { ...values, [column.name]: typedValue };
        const nextErrors = { ...errorMessages };
        delete nextErrors[column.name];
        setValues(nextValues);
        setErrorMessages(nextErrors);

        if (columnIndex === visibleColumns.length - 1) {
          void commitRow(nextValues, nextErrors);
        } else {
          focusInput(columnIndex + 1);
        }
      },
    [commitRow, errorMessages, focusInput, values, visibleColumns],
  );

  return (
    <div
      aria-rowindex={ariaRowIndex}
      className={[classBase, className].filter(Boolean).join(" ")}
      ref={containerRef}
      role="row"
      style={style}
    >
      {virtualColSpan > 0 ? (
        <div
          aria-hidden
          className={`${classBase}-virtualColSpan`}
          style={{ width: virtualColSpan }}
        />
      ) : null}
      {visibleColumns.map((column, index) => {
        const errorMessage = errorMessages[column.name];
        const errorId = `${errorIdPrefix}-${column.name}-error`;
        return (
          <div
            aria-colindex={column.ariaColIndex}
            className={`${classBase}Cell vuuTableCell${
              column.align === "right" ? " vuuTableCell-right" : ""
            }`}
            data-field={column.name}
            key={column.name}
            role="cell"
            style={{ width: column.width }}
          >
            <VuuInput
              className={errorMessage ? "vuuEditing" : undefined}
              commitOnBlur={false}
              disabled={submitting}
              errorMessage={errorMessage}
              inputProps={{
                "aria-describedby": errorMessage ? errorId : undefined,
                "aria-invalid": errorMessage ? true : undefined,
                "aria-label": column.label,
                onChange: (evt) =>
                  setValues((current) => ({
                    ...current,
                    [column.name]: evt.target.value,
                  })),
                placeholder: "Enter value",
                value: values[column.name]?.toString() ?? "",
              }}
              onCommit={handleCommit(index)}
              variant="primary"
            />
            {errorMessage ? (
              <span className={`${classBase}-errorText`} id={errorId}>
                {errorMessage}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
