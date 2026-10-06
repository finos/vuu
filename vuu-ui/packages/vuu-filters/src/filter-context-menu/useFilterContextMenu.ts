import {
  ContextMenuItemDescriptor,
  MenuActionHandler,
  MenuBuilder,
} from "@vuu-ui/vuu-context-menu";
import type {
  ColumnDescriptor,
  DataRow,
  TableContextMenuDef,
  TableContextMenuOptions,
  TableMenuLocation,
} from "@vuu-ui/vuu-table-types";
import {
  filtersAreEqual,
  getTemporalCellFilter,
  getTemporalInfo,
  withDateTimePattern,
  type DateTimePattern,
} from "@vuu-ui/vuu-utils";
import { useCallback, useMemo, useRef } from "react";
import {
  useColumnFilterRegistry,
  useSavedFilters,
} from "../filter-provider/FilterContext";
import { FilterAggregator } from "../FilterAggregator";

const EmptyAggregator = new FilterAggregator();

export interface FilterContextMenuHookProps {
  filterColumns: string[] | "*";
  /**
   * The date/time pattern of the ColumnFilter for a temporal column, keyed by
   * column name. A filter created from a cell value matches the value at the
   * precision displayed by the ColumnFilter, e.g a ColumnFilter with time
   * pattern 'hh:mm:ss.ms' filters the whole millisecond. Where no pattern is
   * provided, the column descriptor registered by a FilterContainerColumnFilter
   * for the column is used, if there is one, otherwise the Table column.
   */
  filterPatterns?: Record<string, DateTimePattern>;
  filterProviderKey?: string;
}

const defaultProps: FilterContextMenuHookProps = {
  filterColumns: "*",
};

interface CellFilter {
  /** The column descriptor with which the filter is created */
  column: ColumnDescriptor;
  label: string;
  op: "=" | "between-inclusive";
  value: string | number | [string, string];
}

export const useFilterContextMenu = ({
  filterColumns = "*",
  filterPatterns,
  filterProviderKey,
}: FilterContextMenuHookProps = defaultProps): TableContextMenuDef => {
  const { currentFilter, clearCurrentFilter, setCurrentFilter } =
    useSavedFilters(filterProviderKey);
  const { getColumnFilterColumn, getColumnFilterPattern } =
    useColumnFilterRegistry(filterProviderKey);
  const filterAggregatorRef = useRef(EmptyAggregator);

  /**
   * A temporal value is filtered at the precision with which the ColumnFilter
   * (if there is one, otherwise the Table) displays it. A ColumnFilter on a
   * 'datetime' column displays a date (DatePicker). A filterPatterns pattern
   * is applied as given. The ColumnFilter is the mounted (registered)
   * ColumnFilter, else as configured by FilterProvider columnFilterPatterns.
   */
  const getCellFilter = useCallback(
    (column: ColumnDescriptor, dataRow: DataRow): CellFilter => {
      const value = dataRow[column.name] as string | number;
      if (getTemporalInfo(column)) {
        const pattern = filterPatterns?.[column.name];
        const columnFilterPattern = getColumnFilterPattern(column.name);
        const columnFilterColumn = pattern
          ? undefined
          : (getColumnFilterColumn(column.name) ??
            (columnFilterPattern
              ? withDateTimePattern(column, columnFilterPattern)
              : undefined));
        const filterColumn = pattern
          ? withDateTimePattern(column, pattern)
          : columnFilterColumn;
        const temporalCellFilter = getTemporalCellFilter(
          filterColumn ?? column,
          value,
          columnFilterColumn !== undefined,
        );
        if (temporalCellFilter) {
          return { column: filterColumn ?? column, ...temporalCellFilter };
        }
      }
      return { column, label: `${value}`, op: "=", value };
    },
    [filterPatterns, getColumnFilterColumn, getColumnFilterPattern],
  );

  useMemo(() => {
    if (
      !filtersAreEqual(currentFilter.filter, filterAggregatorRef.current.filter)
    ) {
      filterAggregatorRef.current = currentFilter.filter
        ? new FilterAggregator(currentFilter.filter)
        : new FilterAggregator();
    }
  }, [currentFilter]);

  const menuBuilder: MenuBuilder<TableMenuLocation, TableContextMenuOptions> =
    useCallback(
      (_location, options) => {
        const { column, dataRow } = options;
        const { current: fag } = filterAggregatorRef;
        const { name, label = name } = column;

        const ClearFilter: ContextMenuItemDescriptor = {
          id: "filter-clear",
          label: "Clear filter",
          options,
        };

        if (filterColumns === "*" || filterColumns.includes(column.name)) {
          const { label: value } = getCellFilter(column, dataRow);
          const SetFilter: ContextMenuItemDescriptor = {
            id: "filter-set",
            label: `Set filter ${label} '${value}'`,
            options,
          };

          if (fag.isEmpty) {
            return [SetFilter];
          } else if (fag.has(column)) {
            if (fag.count === 1) {
              return [ClearFilter];
            } else {
              return [
                {
                  id: "filter-remove",
                  label: `Remove ${label} '${value}' from filter`,
                  options,
                },
                SetFilter,
                ClearFilter,
              ];
            }
          } else {
            return [
              SetFilter,
              {
                id: "filter-add",
                label: `Add ${label} '${value}' to existing filter`,
                options,
              },
              ClearFilter,
            ];
          }
        } else if (!fag.isEmpty) {
          return [ClearFilter];
        } else {
          return [];
        }
      },
      [filterColumns, getCellFilter],
    );

  const menuActionHandler = useCallback<
    MenuActionHandler<string, TableContextMenuOptions>
  >(
    (menuItemId, options) => {
      if (options) {
        const { current: fag } = filterAggregatorRef;
        const { column, dataRow } = options;
        switch (menuItemId) {
          case "filter-clear":
            {
              clearCurrentFilter();
            }
            break;

          case "filter-add":
            {
              const cellFilter = getCellFilter(column, dataRow);
              fag.add(cellFilter.column, cellFilter.value, cellFilter.op);
              if (fag.filter) {
                setCurrentFilter(fag.filter);
              }
            }
            break;
          case "filter-remove":
            {
              fag.remove(column);
              if (fag.filter) {
                setCurrentFilter(fag.filter);
              }
            }
            break;
          case "filter-set":
            {
              const cellFilter = getCellFilter(column, dataRow);
              fag.clear();
              fag.add(cellFilter.column, cellFilter.value, cellFilter.op);
              if (fag.filter) {
                setCurrentFilter(fag.filter);
              }
            }
            break;
          default:
            return false;
        }
      } else {
        return false;
      }
    },
    [clearCurrentFilter, getCellFilter, setCurrentFilter],
  );

  return {
    menuActionHandler,
    menuBuilder,
  };
};
