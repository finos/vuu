import type { DataSource } from "@vuu-ui/vuu-data-types";
import { Table } from "@vuu-ui/vuu-table";
import type { TableConfig } from "@vuu-ui/vuu-table-types";
import type { CSSProperties, ReactNode } from "react";
import { useMemo } from "react";
import {
  createDateTimeDataSource,
  type ExampleColumn,
  toColumnDescriptor,
} from "./date-time-data";

const noteStyle: CSSProperties = {
  color: "var(--salt-content-secondary-foreground)",
  fontSize: 12,
  lineHeight: "18px",
  margin: 0,
  maxWidth: 900,
};

export const ExampleLayout = ({
  children,
  notes,
  title,
  style,
}: {
  children: ReactNode;
  notes?: ReactNode;
  title?: string;
  style?: CSSProperties;
}) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      boxSizing: "border-box",
      gap: 12,
      height: "100%",
      overflow: "auto",
      padding: 16,
      ...style,
    }}
  >
    {title ? <h3 style={{ margin: 0 }}>{title}</h3> : null}
    {notes ? <div style={noteStyle}>{notes}</div> : null}
    {children}
  </div>
);

/**
 * Renders a JSON representation of a value, stringifying bigint.
 */
const toJson = (value: unknown) =>
  value === undefined
    ? "undefined"
    : JSON.stringify(value, (_k, v) => (typeof v === "bigint" ? `${v}n` : v));

export const JsonValue = ({
  label,
  value,
  testId,
}: {
  label?: string;
  value: unknown;
  testId?: string;
}) => (
  <div style={{ fontFamily: "monospace", fontSize: 12 }}>
    {label ? <strong>{label}: </strong> : null}
    <span data-testid={testId}>{toJson(value)}</span>
  </div>
);

const codeStyle: CSSProperties = {
  display: "inline-block",
  maxWidth: "100%",
  background: "var(--salt-container-secondary-background)",
  border: "1px solid var(--salt-separable-tertiary-borderColor)",
  borderRadius: 4,
  fontFamily: "var(--salt-typography-fontFamily-code, monospace)",
  fontSize: 12,
  lineHeight: "18px",
  overflowWrap: "anywhere",
  padding: "1px 6px",
};

/**
 * Inline code, a string or JSON representation of a value.
 */
export const Code = ({
  children,
  testId,
}: {
  children: unknown;
  testId?: string;
}) => (
  <code data-testid={testId} style={codeStyle}>
    {typeof children === "string" ? children : toJson(children)}
  </code>
);

const cellStyle: CSSProperties = {
  borderBottom: "1px solid var(--salt-separable-tertiary-borderColor)",
  padding: "8px 12px",
  textAlign: "left",
  verticalAlign: "top",
};

const headerCellStyle: CSSProperties = {
  ...cellStyle,
  background: "var(--salt-container-tertiary-background)",
  borderBottom: "2px solid var(--salt-separable-secondary-borderColor)",
  fontWeight: 600,
  whiteSpace: "nowrap",
};

export interface ExampleTableColumn {
  label: string;
  width?: number | string;
}

/**
 * A table for presenting example inputs and outputs. Cells are ReactNodes,
 * use Code for code values.
 */
export const ExampleTable = ({
  columns,
  rows,
}: {
  columns: ExampleTableColumn[];
  rows: { key: string; cells: ReactNode[] }[];
}) => (
  <table
    role="table"
    style={{
      border: "1px solid var(--salt-separable-tertiary-borderColor)",
      borderCollapse: "collapse",
      borderRadius: 4,
      fontSize: 13,
      lineHeight: "20px",
      maxWidth: 1300,
      tableLayout: "fixed",
      width: "100%",
    }}
  >
    <colgroup>
      {columns.map(({ label, width }) => (
        <col key={label} style={{ width }} />
      ))}
    </colgroup>
    <thead>
      <tr>
        {columns.map(({ label }) => (
          <th key={label} style={headerCellStyle}>
            {label}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {rows.map(({ key, cells }, i) => (
        <tr
          key={key}
          style={{
            background:
              i % 2 === 1
                ? "var(--salt-container-secondary-background)"
                : "var(--salt-container-primary-background)",
          }}
        >
          {cells.map((cell, j) => (
            <td key={j} style={cellStyle}>
              {cell}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

export interface DateTimeTableProps {
  columns: ExampleColumn[];
  dataSource?: DataSource;
  height?: number;
  width?: number;
}

/**
 * A Table over the DateTime test data. Each column presents the values of
 * its 'source' column (see date-time-data).
 */
export const DateTimeTable = ({
  columns,
  dataSource: dataSourceProp,
  height = 400,
  width = 1100,
}: DateTimeTableProps) => {
  const config = useMemo<TableConfig>(
    () => ({
      columns: columns.map((col) => ({
        width: 180,
        ...toColumnDescriptor(col),
      })),
      columnSeparators: true,
      rowSeparators: true,
      zebraStripes: true,
    }),
    [columns],
  );
  const dataSource = useMemo(
    () => dataSourceProp ?? createDateTimeDataSource(columns),
    [columns, dataSourceProp],
  );
  return (
    <Table
      config={config}
      dataSource={dataSource}
      height={height}
      renderBufferSize={20}
      width={width}
    />
  );
};
