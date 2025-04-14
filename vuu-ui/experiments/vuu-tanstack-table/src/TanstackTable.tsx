import React, { useRef } from "react";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { flexRender } from "@tanstack/react-table";
import {
  TanstackTableProps,
  useTanstackTableWithVuuDatasource,
} from "./useTanstackTableWithVuuDatasource";
import { PaginationControl } from "@finos/vuu-table";

import tableCss from "./TanstackTable.css";

const classBase = "TanstackTable";

export const TanstackTable = ({ columns }: TanstackTableProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-table",
    css: tableCss,
    window: targetWindow,
  });

  const parentRef = useRef<HTMLDivElement>(null);

  const { dataSource, table } = useTanstackTableWithVuuDatasource({ columns });

  const { rows } = table.getRowModel();

  //   const virtualizer = useVirtualizer({
  //     count: rows.length,
  //     getScrollElement: () => parentRef.current,
  //     estimateSize: () => 34,
  //     overscan: 20,
  //   });

  return (
    <div className={classBase}>
      <div ref={parentRef} className="container">
        {/* <div style={{ height: `${virtualizer.getTotalSize()}px` }}> */}
        <div>
          <table>
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <th
                        key={header.id}
                        colSpan={header.colSpan}
                        style={{ width: header.getSize() }}
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            {...{
                              className: header.column.getCanSort()
                                ? "cursor-pointer select-none"
                                : "",
                              onClick: header.column.getToggleSortingHandler(),
                            }}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            {{
                              asc: " 🔼",
                              desc: " 🔽",
                            }[header.column.getIsSorted() as string] ?? null}
                          </div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {rows.map((row) => {
                return (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => {
                      return (
                        <td key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <PaginationControl dataSource={dataSource} />
    </div>
  );
};

/**
 * 
 *               {virtualizer.getVirtualItems().map((virtualRow, index) => {
                const row = rows[virtualRow.index];
                console.log(`[TanstackTable] [${index}]`, {
                  virtualRow,
                });
                return (
                  <tr

 */
