import {
  ColumnFilterChangeHandler,
  ColumnFilterCommitHandler,
  ColumnFilterOp,
  ColumnFilterValue,
  Filter,
  FilterContainerFilter,
} from "@vuu-ui/vuu-filter-types";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { createContext, useCallback, useContext, useMemo, useRef } from "react";
import {
  FilterAggregator,
  getColumnValueFromFilter,
  isSingleValueFilter,
} from "@vuu-ui/vuu-utils";

export interface ColumnFilterContextProps {
  filterContainerInstalled: boolean;
  filterProviderKey?: string;
  onChange?: ColumnFilterChangeHandler;
  onCommit?: ColumnFilterCommitHandler;
  register?: (
    column: ColumnDescriptor,
    operator: ColumnFilterOp,
  ) => ColumnFilterValue;
  getValue?: (column: ColumnDescriptor) => ColumnFilterValue;
}

export const ColumnFilterContext = createContext<ColumnFilterContextProps>({
  filterContainerInstalled: false,
});

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore type-check incorrectly flags this as error, its perfectly valid
export function useFilterContext(
  column: ColumnDescriptor,
  throwIfNoContainer?: false,
): ColumnFilterContextProps;
export function useFilterContext(
  column: ColumnDescriptor,
  throwIfNoContainer: true,
): Required<ColumnFilterContextProps>;
export function useFilterContext(
  column: ColumnDescriptor,
  throwIfNoContainer = false,
) {
  const ctx = useContext(ColumnFilterContext);
  if (ctx) {
    return {
      filterProviderKey: ctx.filterProviderKey,
      register: ctx.register,
      getValue: ctx.getValue,
      onChange: ctx.onChange,
      onCommit: ctx.onCommit,
    };
  } else if (throwIfNoContainer) {
    throw Error(
      `[useFilterContainer:useFilterContext] no FilterContainer installed`,
    );
  } else {
    return { filterContainerInstalled: false };
  }
}

export type FilterAppliedHandler<F extends Filter = Filter> = (
  filter: F,
) => void;
export type ColumnFilterContainerHookProps = {
  filter?: FilterContainerFilter;
  filterProviderKey?: string;
  onFilterApplied?: FilterAppliedHandler<FilterContainerFilter>;
  onFilterCleared?: () => void;
};

type ColumnFilterValueMap = Record<string, ColumnFilterValue>;

export const EmptyTuple: ColumnFilterValue = ["", ""];

export const useFilterContainer = ({
  filter,
  filterProviderKey = "GLOBAL",
  onFilterApplied,
  onFilterCleared,
}: ColumnFilterContainerHookProps): ColumnFilterContextProps => {
  const valueRef = useRef<ColumnFilterValueMap>({});

  const filterAggregator = useMemo(
    () => new FilterAggregator(filter),
    [filter],
  );

  const register = useCallback(
    (column: ColumnDescriptor, op: ColumnFilterOp) =>
      (valueRef.current[column.name] = getColumnValueFromFilter(
        column,
        op,
        filter,
      )),
    [filter],
  );

  const getValue = useCallback(
    (column: ColumnDescriptor, fallbackValue?: ColumnFilterValue) => {
      const value = valueRef.current[column.name];
      if (value !== undefined) {
        return value;
      } else if (fallbackValue !== undefined) {
        return fallbackValue;
      } else {
        throw Error(
          `[useFilterContainer] column ${column.name} has not been registered`,
        );
      }
    },
    [],
  );

  const handleCommit = useCallback<ColumnFilterCommitHandler>(
    (column, op, value = "") => {
      if (Array.isArray(value)) {
        if (!op.startsWith("between")) {
          throw Error(
            `[useFilterContainer] array value is not valid for operator ${op}`,
          );
        }
        if (value[0] === "" && value[1] === "") {
          if (!filterAggregator.remove(column)) {
            return;
          }
        } else {
          if (typeof value[0] === "string" && typeof value[1] === "string") {
            filterAggregator.add(column, value);
          } else {
            throw Error(
              `[useFilterContainer] handleCommit value  [${typeof value[0]},${typeof value[1]}] for operator ${op} supports [string,string] only`,
            );
          }
        }
      } else if (value === "") {
        if (!filterAggregator.remove(column)) {
          return;
        }
      } else {
        if (typeof value === "string" || typeof value === "number") {
          filterAggregator.add(column, value);
        } else {
          throw Error(
            `[useFilterContainer] handleCommit value ${typeof value} supports string, number only`,
          );
        }
      }
      const { filter } = filterAggregator;
      if (filter) {
        onFilterApplied?.(filter);
      } else {
        onFilterCleared?.();
      }
    },
    [filterAggregator, onFilterApplied, onFilterCleared],
  );

  const handleInputChange = useCallback<ColumnFilterChangeHandler>(
    (value, column) => {
      // If the filterAggregator has this column, then the value has previously been committed.
      // As soon as user starts editing the value, we un-commit.
      if (filterAggregator.has(column)) {
        if (Array.isArray(value)) {
          // TODO check whether first value has been changed
          const filter = filterAggregator.get(column);
          if (isSingleValueFilter(filter)) {
            // do nothing, the first value has been committed
          } else {
            handleCommit(column, "between", ["", ""]);
          }
        } else {
          handleCommit(column, "=", "");
        }
      }
      valueRef.current[column.name] = value;
    },
    [filterAggregator, handleCommit],
  );

  return {
    filterContainerInstalled: true,
    filterProviderKey,
    onChange: handleInputChange,
    onCommit: handleCommit,
    getValue,
    register,
  };
};
