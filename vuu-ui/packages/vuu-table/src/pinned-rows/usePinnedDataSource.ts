import { useData } from "@vuu-ui/core";
import type {
  DataSource,
  DataSourceConfigChangeHandler,
  DataSourceFilter,
  TableSchema,
} from "@vuu-ui/vuu-data-types";
import type { TablePinnedRows } from "@vuu-ui/vuu-table-types";
import { isTextColumnInSchema } from "@vuu-ui/vuu-utils";
import { useEffect, useMemo, useRef, useState } from "react";

export const DEFAULT_MAX_PINNED_ROWS = 5;

const NO_KEYS: (string | number)[] = [];

const formatKey = (key: string | number, quoted: boolean) =>
  quoted ? JSON.stringify(`${key}`) : `${key}`;

export const pinnedRowsFilter = (keyColumn: string, keys: string[]) =>
  `${keyColumn} in [${keys.join(",")}]`;

/**
 * The Vuu filter grammar has no `not in`, so pinned rows are excluded
 * from the main data source with a chain of `!=` clauses.
 */
export const excludePinnedRowsFilter = (keyColumn: string, keys: string[]) =>
  keys.map((key) => `${keyColumn} != ${key}`).join(" and ");

const combineFilters = (
  filter1: string | undefined,
  filter2: string,
): DataSourceFilter => {
  if (filter1 === undefined || filter1.trim() === "") {
    return { filter: filter2 };
  } else {
    return { filter: `(${filter1}) and ${filter2}` };
  }
};

const sameJson = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);

export interface PinnedDataSourceHookProps {
  dataSource: DataSource;
  pinnedRows?: TablePinnedRows;
  tableSchema?: TableSchema;
}

/**
 * Creates and manages the data source for pinned rows, when pinnedRows
 * have been specified. Pinned rows are excluded from the main data source
 * via its baseFilter, which is combined with any baseFilter already in place.
 */
export const usePinnedDataSource = ({
  dataSource,
  pinnedRows,
  tableSchema,
}: PinnedDataSourceHookProps) => {
  const { VuuDataSource } = useData();
  const maxPinnedRows = pinnedRows?.maxPinnedRows ?? DEFAULT_MAX_PINNED_ROWS;
  const keyColumn = pinnedRows?.keyColumn ?? tableSchema?.key;
  const allKeys = pinnedRows?.keys ?? NO_KEYS;
  const keysTruncated = allKeys.length > maxPinnedRows;

  // keys are compared by value, consumers may pass a new array each render
  const keysJson = JSON.stringify(allKeys);
  const formattedKeys = useMemo<string[]>(() => {
    if (keyColumn === undefined || tableSchema === undefined) {
      return [];
    }
    const quoted = isTextColumnInSchema(tableSchema, keyColumn);
    const keys: (string | number)[] = JSON.parse(keysJson);
    return keys.slice(0, maxPinnedRows).map((key) => formatKey(key, quoted));
  }, [keysJson, keyColumn, maxPinnedRows, tableSchema]);

  const hasPinnedRows = keyColumn !== undefined && formattedKeys.length > 0;
  const { table } = dataSource;

  const warnedRef = useRef({ noTable: false, truncated: false });
  if (pinnedRows && table === undefined && !warnedRef.current.noTable) {
    warnedRef.current.noTable = true;
    console.warn(
      "[Table] pinnedRows requires a dataSource with a Vuu table, pinned rows will not be shown",
    );
  }
  if (keysTruncated && !warnedRef.current.truncated) {
    warnedRef.current.truncated = true;
    console.warn(
      `[Table] ${allKeys.length} pinned row keys, but maxPinnedRows is ${maxPinnedRows}. Rows beyond the limit remain in the body.`,
    );
  } else if (!keysTruncated) {
    warnedRef.current.truncated = false;
  }

  const pinnedFilter = hasPinnedRows
    ? pinnedRowsFilter(keyColumn, formattedKeys)
    : undefined;
  const exclusionFilter = hasPinnedRows
    ? excludePinnedRowsFilter(keyColumn, formattedKeys)
    : undefined;

  const pinnedFilterRef = useRef(pinnedFilter);
  pinnedFilterRef.current = pinnedFilter;

  const [pinnedDataSource, setPinnedDataSource] = useState<DataSource>();
  const isEnabled = hasPinnedRows && table !== undefined;

  // Create the pinned data source, it is retained while the set of pinned
  // rows changes and discarded when there are no pinned rows.
  useEffect(() => {
    if (isEnabled && table) {
      const ds = new VuuDataSource({
        columns: dataSource.columns,
        filterSpec: { filter: pinnedFilterRef.current ?? "" },
        sort: dataSource.sort,
        table,
      });
      setPinnedDataSource(ds);
      return () => {
        setPinnedDataSource(undefined);
        // The Table suspends the data source when it stops rendering it,
        // unsubscribe once that has happened.
        setTimeout(() => {
          if (ds.status !== "unsubscribed" && ds.status !== "initialising") {
            ds.unsubscribe();
          }
        }, 0);
      };
    }
  }, [VuuDataSource, dataSource, isEnabled, table]);

  useEffect(() => {
    if (pinnedDataSource && pinnedFilter !== undefined) {
      if (pinnedDataSource.filter.filter !== pinnedFilter) {
        pinnedDataSource.filter = { filter: pinnedFilter };
      }
    }
  }, [pinnedDataSource, pinnedFilter]);

  // Pinned rows follow the sort and columns of the main data source, they
  // are never grouped.
  useEffect(() => {
    if (pinnedDataSource) {
      const syncConfig = () => {
        if (!sameJson(pinnedDataSource.sort, dataSource.sort)) {
          pinnedDataSource.sort = dataSource.sort;
        }
        if (!sameJson(pinnedDataSource.columns, dataSource.columns)) {
          pinnedDataSource.columns = dataSource.columns;
        }
      };
      const handleConfigChange: DataSourceConfigChangeHandler = () =>
        syncConfig();
      syncConfig();
      dataSource.on("config", handleConfigChange);
      return () => {
        dataSource.removeListener("config", handleConfigChange);
      };
    }
  }, [dataSource, pinnedDataSource]);

  // Exclude pinned rows from the main data source. Any baseFilter
  // set by the consumer is preserved and restored when rows are unpinned.
  useEffect(() => {
    if (exclusionFilter && pinnedDataSource) {
      let consumerBaseFilter = dataSource.baseFilter?.filter;
      let appliedFilter = combineFilters(consumerBaseFilter, exclusionFilter);
      dataSource.baseFilter = appliedFilter;

      const handleConfigChange: DataSourceConfigChangeHandler = () => {
        const currentFilter = dataSource.baseFilter?.filter;
        if (currentFilter !== appliedFilter.filter) {
          // consumer has changed the baseFilter
          consumerBaseFilter = currentFilter;
          appliedFilter = combineFilters(consumerBaseFilter, exclusionFilter);
          dataSource.baseFilter = appliedFilter;
        }
      };
      dataSource.on("config", handleConfigChange);

      return () => {
        dataSource.removeListener("config", handleConfigChange);
        if (dataSource.baseFilter?.filter === appliedFilter.filter) {
          dataSource.baseFilter =
            consumerBaseFilter === undefined
              ? undefined
              : { filter: consumerBaseFilter };
        }
      };
    }
  }, [dataSource, exclusionFilter, pinnedDataSource]);

  return {
    maxPinnedRows,
    maxVisibleRows: pinnedRows?.maxVisibleRows ?? maxPinnedRows,
    pinnedDataSource: isEnabled ? pinnedDataSource : undefined,
  };
};
