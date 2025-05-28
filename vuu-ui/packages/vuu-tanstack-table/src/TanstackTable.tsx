import { PaginationControl } from "@finos/vuu-table";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { flexRender } from "@tanstack/react-table";
import { type CSSProperties, useCallback, useRef } from "react";
import {
  TanstackTableProps,
  useTanstackTableWithVuuDatasource,
} from "./useTanstackTableWithVuuDatasource";
import { useVirtualColumns } from "./useVirtualColumns";
import { useVirtualisedScrollRowRendering } from "./useVirtualisedScrollRowRendering";
import { usePaginatedRowRendering } from "./usePaginatedRowRendering";
import { useMeasuredHeight } from "./useMeasuredHeight";
import { Row, RowProxy } from "./Row";
import { ColumnActionHandler, ColumnMenu } from "./ColumnMenu";
import { DataProvider } from "./DataProvider";
import cx from "clsx";

import tableCss from "./TanstackTable.css";
import { useForkRef } from "@salt-ds/core";
import { DataSourceRow } from "@finos/vuu-data-types";

const classBase = "TanstackTable";

interface TableCSS extends CSSProperties {
  "--content-height": string;
  "--header-height": `${number}px`;
  "--row-height": `${number}px`;
}
export const TanstackTable = <T extends object>({
  columns,
  dataSource,
  headerHeight = 25,
  rowHeight: rowHeightProp,
  showColumnMenu,
  showPaginationControls,
}: TanstackTableProps<T>) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-table",
    css: tableCss,
    window: targetWindow,
  });

  const parentRef = useRef<HTMLDivElement>(null);

  const { measuredHeight: rowHeight, measuredRef: rowRef } = useMeasuredHeight({
    height: rowHeightProp,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { setRange, table, totalRowCount } =
    useTanstackTableWithVuuDatasource<any>({
      columns,
      dataSource,
      rowHeight,
      showPaginationControls,
    });

  const { rows } = table.getRowModel();

  const useRowRenderingHook = showPaginationControls
    ? usePaginatedRowRendering
    : useVirtualisedScrollRowRendering;
  const {
    contentHeight,
    scrollableContainerRef: setScrollableContainer,
    tableBodyRef,
  } = useRowRenderingHook({
    headerHeight,
    rowHeight,
    setRange,
    totalRowCount,
  });

  const scrollableContainerRef = useRef<HTMLDivElement>(null);

  const style: TableCSS = {
    "--content-height":
      typeof contentHeight === "string" ? contentHeight : `${contentHeight}px`,
    "--header-height": `${headerHeight}px`,
    "--row-height": `${rowHeight}px`,
  };

  const bodyStyle = showPaginationControls
    ? undefined
    : {
        height: contentHeight,
      };

  const virtualizedOptions = useVirtualColumns({
    scrollableContainerRef,
    table,
  });

  const {
    virtualItems: virtualColumns,
    virtualPaddingLeading,
    virtualPaddingTrailing,
  } = virtualizedOptions;

  const columnActionHandler = useCallback<ColumnActionHandler>((action) => {
    console.log(`columnActionHandler ${action.type}`);
  }, []);

  return (
    <DataProvider dataSource={dataSource}>
      <div
        className={cx(classBase, {
          [`${classBase}-paginated`]: showPaginationControls,
        })}
        style={style}
      >
        <RowProxy ref={rowRef} height={rowHeightProp} />

        <div ref={parentRef} className={`${classBase}-container`}>
          <div
            className={`${classBase}-contentContainer`}
            ref={useForkRef(setScrollableContainer, scrollableContainerRef)}
          >
            <div className={`${classBase}-table`} role="table">
              <div className={`${classBase}Header`}>
                {table.getHeaderGroups().map((headerGroup) => (
                  <div
                    className="Table-col-headings"
                    key={headerGroup.id}
                    role="rowgroup"
                  >
                    <div className={`${classBase}-col-headers`} role="row">
                      <div
                        className={cx(
                          `${classBase}HeaderCell`,
                          `${classBase}SpacerCell`,
                        )}
                        key="leadingSpacer"
                        style={{ width: virtualPaddingLeading }}
                      />
                      {virtualColumns.map((virtualColumn) => {
                        const header = headerGroup.headers[virtualColumn.index];
                        const isSorted = header.column.getIsSorted();
                        // const sortIndex = header.column.getSortIndex();

                        return (
                          <div
                            className={`${classBase}HeaderCell`}
                            key={header.id}
                            role="columnheader"
                            style={{ width: header.getSize() }}
                          >
                            {header.isPlaceholder ? null : (
                              <div
                                {...{
                                  className: header.column.getCanSort()
                                    ? "cursor-pointer select-none"
                                    : "",
                                  onClick:
                                    header.column.getToggleSortingHandler(),
                                }}
                              >
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
                                {{
                                  asc: " 🔼",
                                  desc: " 🔽",
                                }[isSorted as string] ?? null}
                                {showColumnMenu ? (
                                  <ColumnMenu
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    column={header.column as any}
                                    onColumnAction={columnActionHandler}
                                    {...showColumnMenu}
                                  />
                                ) : null}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <div
                        className={cx(
                          `${classBase}HeaderCell`,
                          `${classBase}SpacerCell`,
                        )}
                        key="trailingSpacer"
                        style={{ width: virtualPaddingTrailing }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div
                className={`${classBase}-body`}
                ref={tableBodyRef}
                style={bodyStyle}
              >
                {rows.map((row) => {
                  // console.log(`row original ${JSON.stringify(row.original)}`);
                  const [idx, key] = row.original as DataSourceRow;
                  // console.log(
                  //   `[Table] [${idx}] key ${key} rowKey ${row.original[6]} selected ${row.original[7]}`,
                  // );
                  return (
                    <Row
                      ariaRowIndex={idx + 2}
                      debugKey={key}
                      position={rowHeight * idx}
                      key={key}
                      row={row}
                      virtualizedOptions={virtualizedOptions}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        {showPaginationControls ? (
          <PaginationControl dataSource={dataSource} />
        ) : null}
      </div>
    </DataProvider>
  );
};
