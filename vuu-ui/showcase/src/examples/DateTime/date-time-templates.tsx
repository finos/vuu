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
      gap: 12,
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
    <span data-testid={testId}>
      {value === undefined
        ? "undefined"
        : JSON.stringify(value, (_k, v) =>
            typeof v === "bigint" ? `${v}n` : v,
          )}
    </span>
  </div>
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
