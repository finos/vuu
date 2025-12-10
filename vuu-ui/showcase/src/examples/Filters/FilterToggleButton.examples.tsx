import { getSchema } from "@vuu-ui/vuu-data-test";
import { FilterProvider } from "@vuu-ui/vuu-filters";
import { UNSAVED_FILTER } from "@vuu-ui/vuu-filters/src/filter-provider/FilterContext";
import { SavedFilterRecord } from "@vuu-ui/vuu-filters/src/filter-provider/FilterProvider";
import {
  FilterToggleButton,
  FilterToggleButtonProps,
} from "@vuu-ui/vuu-filters/src/filter-toggle-button/FilterToggleButton";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { useCallback, useMemo } from "react";

const schema = getSchema("instruments");

export const DefaultFilter = ({
  columns = schema.columns,
}: Partial<Pick<FilterToggleButtonProps, "columns">>) => {
  const handleToggle = useCallback(() => {
    console.log("Button toggled");
  }, []);

  return (
    <div style={{ padding: 100 }}>
      <FilterToggleButton columns={columns} onToggle={handleToggle} />
    </div>
  );
};

export const WithEmptyFilterProvider = () => {
  return (
    <FilterProvider>
      <DefaultFilter />
    </FilterProvider>
  );
};

export const WithSingleFilterClause = () => {
  const savedFilters = useMemo<SavedFilterRecord>(
    () => ({
      GLOBAL: [
        {
          id: UNSAVED_FILTER,
          active: true,
          filter: { column: "currency", op: "=", value: "GBP" },
        },
      ],
    }),
    [],
  );
  return (
    <FilterProvider savedFilters={savedFilters}>
      <DefaultFilter />
    </FilterProvider>
  );
};

export const WithMultipleFilterClauses = () => {
  const columns: ColumnDescriptor[] = [
    { name: "currency", label: "Currency", serverDataType: "string" },
    { name: "exchange", serverDataType: "string" },
    { name: "price", serverDataType: "double" },
    {
      name: "vuuCreatedTimestamp",
      label: "Created Time",
      serverDataType: "long",
      type: {
        name: "date/time",
        formatting: {
          pattern: {
            time: "hh:mm:ss",
          },
        },
      },
    },
  ];

  const savedFilters = useMemo<SavedFilterRecord>(
    () => ({
      GLOBAL: [
        {
          id: UNSAVED_FILTER,
          active: true,
          filter: {
            op: "and",
            filters: [
              { column: "currency", op: "=", value: "GBP" },
              { column: "exchange", op: "=", value: "XLON" },
              { column: "price", op: ">", value: 1000 },
              { column: "vuuCreatedTimestamp", op: "=", value: +new Date() },
            ],
          },
        },
      ],
    }),
    [],
  );
  return (
    <FilterProvider savedFilters={savedFilters}>
      <DefaultFilter columns={columns} />
    </FilterProvider>
  );
};
