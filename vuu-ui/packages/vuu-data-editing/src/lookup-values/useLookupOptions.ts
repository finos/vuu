import type {
  DataSourceSubscribeCallback,
  DataSourceRow,
} from "@vuu-ui/vuu-data-types";
import type { VuuRowDataItemType, VuuTable } from "@vuu-ui/vuu-protocol-types";
import { Range, useData } from "@vuu-ui/vuu-utils";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  lookupOptionsFromRows,
  type LookupOption,
  type OptionMap,
} from "./useLookupValues";

const DATA_ROW_COLUMN_OFFSET = 10;

export type LookupRow = Readonly<Record<string, VuuRowDataItemType>>;

export interface LookupOptionsHookProps<T = LookupOption> {
  /** @default true */
  enabled?: boolean;
  /** The lookup table. */
  table?: VuuTable;
  /**
   * Maps rows to `LookupOption` (`{ value, label, metadata }`). Either
   * `optionMap` or `columns` plus `mapRow` is required.
   */
  optionMap?: OptionMap;
  /** Columns to subscribe to. Defaults to the columns named in `optionMap`. */
  columns?: readonly string[];
  /** Maps a row (column name to value) to an option. Overrides `optionMap`. */
  mapRow?: (row: LookupRow) => T;
  /** A Vuu filter expression, e.g. `ccy = "EUR"`. */
  filter?: string;
  /** @default 100 */
  maxRows?: number;
}

export interface LookupOptionsHookResult<T> {
  options: T[];
  loading: boolean;
  error?: Error;
}

const rowToRecord = (columns: string[], row: DataSourceRow): LookupRow =>
  Object.fromEntries(
    columns.map((column, i) => [column, row[i + DATA_ROW_COLUMN_OFFSET]]),
  ) as LookupRow;

/**
 * Subscribes to a (typically small) lookup table and maps its rows to
 * options, e.g. for a dropdown. Unlike `useLookupValues`, this supports any
 * row mapping, a filter and a row limit, and reports `loading` and `error`.
 *
 * Pass stable (memoized) values for `optionMap`, `columns` and `mapRow`.
 */
export const useLookupOptions = <T = LookupOption>({
  columns: columnsProp,
  enabled = true,
  filter,
  mapRow,
  maxRows = 100,
  optionMap,
  table,
}: LookupOptionsHookProps<T>): LookupOptionsHookResult<T> => {
  const { VuuDataSource } = useData();
  const [state, setState] = useState<LookupOptionsHookResult<T>>({
    loading: false,
    options: [],
  });
  const mapRowRef = useRef(mapRow);
  mapRowRef.current = mapRow;

  const columns = useMemo<string[]>(() => {
    if (columnsProp) {
      return [...columnsProp];
    } else if (optionMap) {
      return [
        optionMap.value,
        optionMap.label,
        ...(optionMap.additionalFields ?? []),
      ];
    }
    return [];
  }, [columnsProp, optionMap]);

  const dataSource = useMemo(
    () =>
      enabled && table && columns.length > 0
        ? new VuuDataSource({
            columns,
            filterSpec: filter ? { filter } : undefined,
            table,
          })
        : undefined,
    [VuuDataSource, columns, enabled, filter, table],
  );

  useEffect(() => {
    if (!dataSource) {
      setState({ loading: false, options: [] });
      return;
    }
    if (!mapRowRef.current && !optionMap) {
      setState({
        error: new Error(
          "[useLookupOptions] either optionMap or mapRow must be provided",
        ),
        loading: false,
        options: [],
      });
      return;
    }

    setState({ loading: true, options: [] });
    let active = true;
    let subscribedColumns: string[] | undefined;

    const fail = (error: Error) => {
      if (active) {
        setState({ error, loading: false, options: [] });
      }
    };

    const subscribe: DataSourceSubscribeCallback = (message) => {
      if (!active) return;
      if (message.type === "subscribed") {
        subscribedColumns = message.columns;
      } else if (message.type === "viewport-update" && subscribedColumns) {
        if (message.rows === undefined) {
          if (message.size === 0) {
            setState({ loading: false, options: [] });
          }
          return;
        }
        try {
          const rows = message.rows.slice(0, maxRows);
          const mapper = mapRowRef.current;
          const options = mapper
            ? rows.map((row) =>
                mapper(rowToRecord(subscribedColumns as string[], row)),
              )
            : (lookupOptionsFromRows(
                subscribedColumns,
                rows,
                optionMap as OptionMap,
              ) as T[]);
          setState({ loading: false, options });
        } catch (cause) {
          fail(cause instanceof Error ? cause : new Error(String(cause)));
        }
      } else if (message.type === "subscribe-failed") {
        fail(
          new Error(
            `[useLookupOptions] subscription to ${table?.table} failed: ${message.msg}`,
          ),
        );
      }
    };

    dataSource
      .subscribe({ range: Range(0, maxRows) }, subscribe)
      .catch((cause) =>
        fail(cause instanceof Error ? cause : new Error(String(cause))),
      );

    return () => {
      active = false;
      dataSource.unsubscribe();
    };
  }, [dataSource, maxRows, optionMap, table]);

  return state;
};
