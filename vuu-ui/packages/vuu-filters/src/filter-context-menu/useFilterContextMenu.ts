import {
  ContextMenuItemDescriptor,
  MenuActionHandler,
  MenuBuilder,
} from "@vuu-ui/vuu-context-menu";
import type {
  TableContextMenuDef,
  TableContextMenuOptions,
  TableMenuLocation,
} from "@vuu-ui/vuu-table-types";
import { filtersAreEqual } from "@vuu-ui/vuu-utils";
import { useCallback, useMemo, useRef } from "react";
import { useSavedFilters } from "../filter-provider/FilterContext";
import { FilterAggregator } from "../FilterAggregator";

const EmptyAggregator = new FilterAggregator();

export interface FilterContextMenuHookProps {
  filterColumns: string[] | "*";
}

const defaultProps: FilterContextMenuHookProps = {
  filterColumns: "*",
};

export const useFilterContextMenu = ({
  filterColumns = "*",
}: FilterContextMenuHookProps = defaultProps): TableContextMenuDef => {
  const { currentFilter, clearCurrentFilter, setCurrentFilter } =
    useSavedFilters();
  const filterAggregatorRef = useRef(EmptyAggregator);

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
        console.log(`menuBuilder _location ${_location} options `, {
          options,
        });
        const { column, columnMap, row } = options;
        const { current: fag } = filterAggregatorRef;
        const { name, label = name } = column;
        const colIdx = columnMap[column.name];
        const value = row[colIdx] as string | number;

        const ClearFilter: ContextMenuItemDescriptor = {
          id: "filter-clear",
          label: "Clear filter",
          options,
        };

        if (filterColumns === "*" || filterColumns.includes(column.name)) {
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
      [filterColumns],
    );

  const menuActionHandler = useCallback<
    MenuActionHandler<string, TableContextMenuOptions>
  >(
    (menuItemId, options) => {
      if (options) {
        const { current: fag } = filterAggregatorRef;
        const { column, columnMap, row } = options;
        switch (menuItemId) {
          case "filter-clear":
            {
              clearCurrentFilter();
            }
            break;

          case "filter-add":
            {
              const colIdx = columnMap[column.name];
              const value = row[colIdx] as string | number;
              fag.add(column, value, "=");
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
              const colIdx = columnMap[column.name];
              const value = row[colIdx] as string | number;
              fag.clear();
              fag.add(column, value, "=");
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
    [clearCurrentFilter, setCurrentFilter],
  );

  return {
    menuActionHandler,
    menuBuilder,
  };
};
