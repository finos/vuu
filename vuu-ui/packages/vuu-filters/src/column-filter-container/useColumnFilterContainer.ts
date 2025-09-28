import {
  ColumnFilterOp,
  ColumnFilterValue,
  Filter,
} from "@vuu-ui/vuu-filter-types";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { createContext, useCallback, useContext, useMemo, useRef } from "react";
import { ColumnFilterCommitHandler } from "../column-filter/useColumnFilter";
import {
  FilterAggregator,
  getColumnValueFromFilter,
  type FilterContainerFilter,
} from "@vuu-ui/vuu-utils";

export type ColumnFilterChangeHandler = (
  value: ColumnFilterValue,
  column: ColumnDescriptor,
  op: ColumnFilterOp,
) => void;

export interface ColumnFilterContextProps {
  filterContainerInstalled: boolean;
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
      register: ctx.register,
      getValue: ctx.getValue,
      onChange: ctx.onChange,
      onCommit: ctx.onCommit,
    };
  } else if (throwIfNoContainer) {
    throw Error(
      `[useColumnFilterContainer:useFilterContext] no FilterContainer installed`,
    );
  } else {
    return { filterContainerInstalled: false };
  }
}

export type FilterAppliedHandler = (filter: Filter) => void;
export type ColumnFilterContainerHookProps = {
  filter?: FilterContainerFilter;
  onFilterApplied?: FilterAppliedHandler;
  onFilterCleared?: () => void;
};

type ColumnFilterValueMap = Record<string, ColumnFilterValue>;

// const defaultValueForColumn = (
//   _column: ColumnDescriptor,
//   op: ColumnFilterOp = "=",
// ): ColumnFilterValue => {
//   if (op === "between") {
//     return ["", ""];
//   } else {
//     return "";
//   }
// };

export const EmptyTuple: ColumnFilterValue = ["", ""];

export const useColumnFilterContainer = ({
  filter,
  onFilterApplied,
  onFilterCleared,
}: ColumnFilterContainerHookProps): ColumnFilterContextProps => {
  const valueRef = useRef<ColumnFilterValueMap>({});

  const filterAggregator = useMemo(
    () => new FilterAggregator(filter),
    [filter],
  );

  console.log(`[useColumnFilter], filter: ${JSON.stringify(filter)}`);

  const register = useCallback(
    (column: ColumnDescriptor, op: ColumnFilterOp) => {
      const defaultValue =
        op === "between"
          ? EmptyTuple
          : (getColumnValueFromFilter(column, filter) as string | number);
      valueRef.current[column.name] = defaultValue;
      return defaultValue;
    },
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
          `[useColumnFilterContainer] column ${column.name} has not been registered`,
        );
      }
    },
    [],
  );

  const handleCommit = useCallback<ColumnFilterCommitHandler>(
    (column, op, value = "") => {
      if (Array.isArray(value)) {
        if (op !== "between") {
          throw Error(
            `[useInlineFilter] array value is not valid for operator ${op}`,
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
              `[useInlineFilter] handleCommit value  [${typeof value[0]},${typeof value[1]}] for operator ${op} supports [string,string] only`,
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
            `[useInlineFilter] handleCommit value ${typeof value} supports string, number only`,
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
      console.log(
        `[useColumnFilterContainer] handleInputChange ${column.name} ${value}`,
      );
      if (filterAggregator.has(column)) {
        console.log(`filteraggregator has column ${column.name}`);
        handleCommit(column, "=", "");
      }
      valueRef.current[column.name] = value;
    },
    [filterAggregator, handleCommit],
  );

  return {
    filterContainerInstalled: true,
    onChange: handleInputChange,
    onCommit: handleCommit,
    getValue,
    register,
  };
};
