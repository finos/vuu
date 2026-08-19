import { useData } from "@vuu-ui/core";
import type {
  DataSourceSubscribeCallback,
  SchemaColumn,
} from "@vuu-ui/vuu-data-types";
import type { VuuTable } from "@vuu-ui/vuu-protocol-types";
import { type DataRowFunc, dataRowFactory } from "@vuu-ui/vuu-table";
import type { DataRow } from "@vuu-ui/vuu-table-types";
import { Range } from "@vuu-ui/vuu-utils";
import { useEffect, useMemo, useState } from "react";
import { errorMessage } from "./admin-contract";

export const LOOKUP_ROW_LIMIT = 1000;

export interface LookupRows {
  error?: string;
  loading: boolean;
  rows: DataRow[];
}

/**
 * Loads up to LOOKUP_ROW_LIMIT rows of a small reference table. `table` and
 * `columns` must be referentially stable.
 */
export const useLookupRows = (
  table: VuuTable,
  columns: readonly string[],
  enabled = true,
  filter?: string,
): LookupRows => {
  const { VuuDataSource } = useData();
  const [resource, setResource] = useState<LookupRows>({
    loading: enabled,
    rows: [],
  });
  const dataSource = useMemo(
    () =>
      enabled
        ? new VuuDataSource({
            bufferSize: LOOKUP_ROW_LIMIT,
            columns: [...columns],
            filterSpec: filter ? { filter } : undefined,
            table,
          })
        : undefined,
    [VuuDataSource, columns, enabled, filter, table],
  );

  useEffect(() => {
    setResource({ loading: !!dataSource, rows: [] });
    if (!dataSource) return;

    let active = true;
    let makeDataRow: DataRowFunc | undefined;
    // Rows by viewport index; updates may carry a single row or only a size.
    let window: DataRow[] = [];
    const subscribe: DataSourceSubscribeCallback = (message) => {
      if (!active) return;
      if (message.type === "subscribed") {
        const missing = columns.filter(
          (column) =>
            !message.columns.includes(column) ||
            !message.tableSchema.columns.some(
              (schemaColumn) => schemaColumn.name === column,
            ),
        );
        if (missing.length > 0) {
          setResource({
            error: `Backend contract unavailable: ${table.table} is missing ${missing.join(", ")}.`,
            loading: false,
            rows: [],
          });
          return;
        }
        [makeDataRow] = dataRowFactory(
          message.columns,
          message.tableSchema.columns as readonly SchemaColumn[],
        );
      } else if (message.type === "viewport-update") {
        if (!makeDataRow) {
          setResource({
            error: `The ${table.table} table sent rows before its column metadata.`,
            loading: false,
            rows: [],
          });
          return;
        }
        const rowFactory = makeDataRow;
        window = [...window];
        if (message.size !== undefined) {
          window.length = Math.min(message.size, LOOKUP_ROW_LIMIT);
        }
        for (const row of message.rows ?? []) {
          const [index] = row;
          if (index < LOOKUP_ROW_LIMIT) window[index] = rowFactory(row);
        }
        setResource({
          loading: false,
          rows: window.filter((row) => row !== undefined),
        });
      } else if (message.type === "subscribe-failed") {
        setResource({
          error: message.msg,
          loading: false,
          rows: [],
        });
      }
    };

    void dataSource
      .subscribe({ range: Range(0, LOOKUP_ROW_LIMIT) }, subscribe)
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
  }, [columns, dataSource, table.table]);

  return resource;
};
