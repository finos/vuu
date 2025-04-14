import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
// A dummy Table Row rendered once and not visible. We measure this to
// determine height of Row(s) and monitor it for size changes (in
// case of runtime density switch). This allows ListItem height to
import { VuuDataRow } from "@finos/vuu-protocol-types";
import type { Row as TanstackRow } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import { forwardRef, memo, MouseEventHandler, useCallback } from "react";

import rowCss from "./Row.css";
import { VirtualItem } from "@tanstack/react-virtual";
import { VirtualizedOptions } from "./useVirtualColumns";

const classBase = "TanstackTable";

// be controlled purely through CSS.
export const RowProxy = forwardRef<HTMLDivElement, { height?: number }>(
  function RowProxy({ height }, forwardedRef) {
    const targetWindow = useWindow();
    useComponentCssInjection({
      testId: "vuu-table-row",
      css: rowCss,
      window: targetWindow,
    });

    return (
      <div
        aria-hidden
        className={cx(`${classBase}Row`, `${classBase}Row-proxy`)}
        ref={forwardedRef}
        style={{ height }}
      />
    );
  },
);

export interface RowProps {
  ariaRowIndex: number;
  debugKey: number;
  position?: number;
  row: TanstackRow<unknown>;
  virtualizedOptions: VirtualizedOptions;
}

export const Row = memo(
  ({
    ariaRowIndex,
    position,
    row,
    virtualizedOptions: {
      virtualItems: virtualColumns,
      virtualPaddingLeading,
      virtualPaddingTrailing,
    },
  }: RowProps) => {
    // const [rowIndex] = row.original as VuuDataRow;
    // console.log(`[Row] [${row.original[0]}] key ${debugKey}`);
    const vuuDataRow = row.original as VuuDataRow;

    const clickHandler = useCallback<MouseEventHandler>(
      (evt) => {
        const handler = row.getToggleSelectedHandler();
        handler(evt);
      },
      [row],
    );

    // console.log(
    //   `row is selected ${row.getIsSelected()} ${row.original.join(",")}`,
    // );

    const visibleCells = row.getVisibleCells();

    const style =
      position === undefined
        ? undefined
        : {
            top: position,
          };

    return (
      <div
        aria-rowindex={ariaRowIndex}
        className={cx(`${classBase}Row`, {
          [`${classBase}Row-selected`]: vuuDataRow[7] !== 0,
        })}
        onClick={clickHandler}
        role="row"
        style={style}
      >
        <div
          className={cx(`${classBase}Cell`, `${classBase}SpacerCell`)}
          key="leadingSpacer"
          style={{ width: virtualPaddingLeading }}
        />
        {virtualColumns.map((virtualColumn) => {
          const cell = visibleCells[virtualColumn.index];
          return (
            <div
              className={`${classBase}Cell`}
              key={cell.id}
              style={{
                width: cell.column.getSize(),
              }}
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </div>
          );
        })}
        <div
          className={cx(`${classBase}Cell`, `${classBase}SpacerCell`)}
          key="trainlingSpacer"
          style={{ width: virtualPaddingTrailing }}
        />
      </div>
    );
  },
  (
    { row: prevRow, virtualizedOptions: prevVirtual },
    { row: nextRow, virtualizedOptions: nextVirtual },
  ) => {
    const sameRow = prevRow.original === nextRow.original;
    const sameSelected = prevRow.getIsSelected() === nextRow.getIsSelected();
    const sameVirtualization =
      prevVirtual.virtualPaddingLeading === nextVirtual.virtualPaddingLeading;
    // console.log(
    //   `row [${nextRow.original[0]}] same as last render ? ${sameRow}`,
    // );
    // if (!sameRow) {
    //   console.log(
    //     `different rows ${prevRow.original[6]} => ${nextRow.original[6]}`,
    //   );
    // }
    return sameRow && sameSelected && sameVirtualization;
  },
);

Row.displayName = "Row";
