import type {
  DataSource,
  DataSourceSubscribeCallback,
  SchemaColumn,
} from "@vuu-ui/vuu-data-types";
import { type DataRowFunc, dataRowFactory } from "@vuu-ui/vuu-table";
import type { DataRow } from "@vuu-ui/vuu-table-types";
import { Range } from "@vuu-ui/vuu-utils";
import { useEffect, useState } from "react";
import { errorMessage } from "./errors";

/** Module discovery holds well under this many rows. */
export const ROW_LIMIT = 1000;

export interface TableRows {
  error?: string;
  loading: boolean;
  rows: DataRow[];
}

/**
 * Keeps every row of a small table, following live updates. `columns` must
 * be referentially stable.
 */
export const useTableRows = (
  dataSource: DataSource,
  columns: readonly string[],
): TableRows => {
  const [resource, setResource] = useState<TableRows>({
    loading: true,
    rows: [],
  });

  useEffect(() => {
    setResource({ loading: true, rows: [] });
    let active = true;
    let makeDataRow: DataRowFunc | undefined;
    let window: DataRow[] = [];
    const tableName = dataSource.table?.table ?? "table";

    const subscribe: DataSourceSubscribeCallback = (message) => {
      if (!active) return;
      if (message.type === "subscribed") {
        const missing = columns.filter(
          (column) =>
            !message.tableSchema.columns.some(({ name }) => name === column),
        );
        if (missing.length > 0) {
          setResource({
            error: `Module discovery is out of date: ${tableName} is missing ${missing.join(", ")}.`,
            loading: false,
            rows: [],
          });
          return;
        }
        [makeDataRow] = dataRowFactory(
          message.columns,
          message.tableSchema.columns as readonly SchemaColumn[],
        );
      } else if (message.type === "viewport-update" && makeDataRow) {
        const rowFactory = makeDataRow;
        window = [...window];
        if (message.size !== undefined) {
          window.length = Math.min(message.size, ROW_LIMIT);
        }
        for (const row of message.rows ?? []) {
          const [index] = row;
          if (index < ROW_LIMIT) window[index] = rowFactory(row);
        }
        setResource({
          loading: false,
          rows: window.filter((row) => row !== undefined),
        });
      } else if (message.type === "subscribe-failed") {
        setResource({ error: message.msg, loading: false, rows: [] });
      }
    };

    void dataSource
      .subscribe({ range: Range(0, ROW_LIMIT) }, subscribe)
      .catch((cause: unknown) => {
        if (active) {
          setResource({
            error: errorMessage(cause),
            loading: false,
            rows: [],
          });
        }
      });

    return () => {
      active = false;
      dataSource.unsubscribe();
    };
  }, [columns, dataSource]);

  return resource;
};
