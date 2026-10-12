import { Button, FormField, FormFieldLabel } from "@salt-ds/core";
import { ContextMenuProvider } from "@vuu-ui/vuu-context-menu";
import {
  FilterContainerColumnFilter,
  FilterPanel,
  FilterProvider,
  type FilterProviderProps,
  useFilterContextMenu,
  useSavedFilters,
  type FilterContextMenuHookProps,
} from "@vuu-ui/vuu-filters";
import type { ColumnFilterOp } from "@vuu-ui/vuu-filter-types";
import { DataSourceStats } from "@vuu-ui/vuu-table-extras";
import {
  DataSourceProvider,
  type DateTimePattern,
  filterAsQuery,
} from "@vuu-ui/vuu-utils";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  createDateTimeDataSource,
  type ExampleColumn,
  toColumnDescriptor,
} from "./date-time-data";
import { DateTimeTable, ExampleLayout, JsonValue } from "./date-time-templates";

const tableColumns: ExampleColumn[] = [
  { name: "id", serverDataType: "string", width: 60 },
  { name: "ccy", serverDataType: "string", width: 60 },
  {
    name: "execTime",
    serverDataType: "epochtimestampnano",
    type: {
      name: "date/time",
      formatting: { pattern: { date: "yyyy-mm-dd", time: "hh:mm:ss" } },
    },
    width: 260,
  },
  {
    name: "tradeTime",
    serverDataType: "epochtimestamp",
    type: {
      name: "date/time",
      formatting: { pattern: { date: "dd MMM yyyy", time: "hh:mm:ss" } },
    },
    width: 200,
  },
  {
    name: "legacyCreated",
    serverDataType: "long",
    type: {
      name: "date/time",
      formatting: { pattern: { date: "yyyy-mm-dd", time: "hh:mm:ss.ms" } },
    },
    width: 220,
  },
];

interface FilterField {
  columnName: string;
  label: string;
  operator?: ColumnFilterOp;
  pattern?: DateTimePattern;
}

const ContextMenuFilterTemplate = ({
  filterFields,
  filterFieldsOnDemand = false,
  filterPatterns,
  notes,
  title,
}: Pick<FilterContextMenuHookProps, "filterPatterns"> & {
  filterFields?: FilterField[];
  /** ColumnFilters are created only when the 'Show filters' button is pressed */
  filterFieldsOnDemand?: boolean;
  notes: ReactNode;
  title: string;
}) => {
  const columnDescriptors = useMemo(
    () => tableColumns.map(toColumnDescriptor),
    [],
  );
  const columnsByName = useMemo(
    () => Object.fromEntries(columnDescriptors.map((col) => [col.name, col])),
    [columnDescriptors],
  );
  const dataSource = useMemo(() => createDateTimeDataSource(tableColumns), []);
  const { currentFilter } = useSavedFilters();
  const [showFilterFields, setShowFilterFields] =
    useState(!filterFieldsOnDemand);
  const filterContextMenuProps = useFilterContextMenu({
    filterColumns: ["ccy", "execTime", "tradeTime", "legacyCreated"],
    filterPatterns,
  });

  useEffect(() => {
    if (currentFilter.filter) {
      dataSource.setFilter(currentFilter.filter);
    } else {
      dataSource.clearFilter();
    }
  }, [currentFilter, dataSource]);

  return (
    <ExampleLayout title={title} notes={notes}>
      <DataSourceProvider dataSource={dataSource}>
        <div style={{ display: "flex", gap: 24 }}>
          {filterFieldsOnDemand ? (
            <Button
              data-testid="toggle-filters"
              onClick={() => setShowFilterFields((show) => !show)}
              style={{ alignSelf: "flex-start" }}
            >
              {showFilterFields ? "Hide filters" : "Show filters"}
            </Button>
          ) : null}
          {filterFields && showFilterFields ? (
            <FilterPanel style={{ width: 320 }}>
              {filterFields.map(({ columnName, label, operator, pattern }) => (
                <FormField key={columnName}>
                  <FormFieldLabel>{label}</FormFieldLabel>
                  <FilterContainerColumnFilter
                    column={columnDescriptors.find(
                      ({ name }) => name === columnName,
                    )!}
                    operator={operator}
                    pattern={pattern}
                  />
                </FormField>
              ))}
            </FilterPanel>
          ) : null}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              width: 500,
            }}
          >
            <JsonValue label="filter" value={currentFilter.filter} />
            <JsonValue
              label="query"
              testId="filter-query"
              value={
                currentFilter.filter
                  ? filterAsQuery(currentFilter.filter, { columnsByName })
                  : ""
              }
            />
          </div>
        </div>
        <ContextMenuProvider {...filterContextMenuProps}>
          <DateTimeTable
            columns={tableColumns}
            dataSource={dataSource}
            height={360}
            width={1000}
          />
        </ContextMenuProvider>
        <DataSourceStats dataSource={dataSource} />
      </DataSourceProvider>
    </ExampleLayout>
  );
};

const columnFilterFields: FilterField[] = [
  { columnName: "ccy", label: "Currency" },
  {
    columnName: "execTime",
    label: "Exec time today, milliseconds (between)",
    operator: "between",
    pattern: { time: "hh:mm:ss.ms" },
  },
  {
    columnName: "tradeTime",
    label: "Trade date",
    pattern: { date: "dd MMM yyyy" },
  },
];

/**
 * Filters created from the Table context menu match the precision of the
 * ColumnFilter, where there is one.
 */
export const ContextMenuFilterMatchesColumnFilter = () => (
  <FilterProvider>
    <ContextMenuFilterTemplate
      filterFields={columnFilterFields}
      title="Context menu filter, ColumnFilter precision"
      notes={
        <>
          Right click a cell to set (or add to) the filter. A filter on a
          temporal value matches the value at the precision displayed by the
          ColumnFilter for that column (FilterContainerColumnFilter registers
          its column with the FilterProvider). The Table shows{" "}
          <code>execTime</code> with nanoseconds, the ColumnFilter shows a time
          of day with milliseconds, so the filter matches the whole millisecond,
          today. The <code>tradeTime</code> ColumnFilter shows a date, so the
          filter matches the whole day. <code>legacyCreated</code> has no
          ColumnFilter, so the filter matches the precision of the Table
          (milliseconds).
        </>
      }
    />
  </FilterProvider>
);

const onDemandFilterFields: FilterField[] = [
  { columnName: "ccy", label: "Currency" },
  { columnName: "execTime", label: "Exec time today" },
  { columnName: "tradeTime", label: "Trade date" },
];

/**
 * Where ColumnFilters are created on demand, they are not registered until
 * shown. FilterProvider columnFilterPatterns (by column name) and
 * columnTypeFilterPatterns (by serverDataType) configure their patterns, so
 * the context menu knows their precision whether or not they are mounted.
 */
export const ContextMenuFilterColumnFilterPatterns = () => {
  const columnFilterPatterns = useMemo<Record<string, DateTimePattern>>(
    () => ({ execTime: { time: "hh:mm:ss" } }),
    [],
  );
  const columnTypeFilterPatterns = useMemo<
    FilterProviderProps["columnTypeFilterPatterns"]
  >(
    () => ({
      epochtimestamp: { date: "dd MMM yyyy" },
      epochtimestampnano: { time: "hh:mm:ss.ms" },
    }),
    [],
  );
  return (
    <FilterProvider
      columnFilterPatterns={columnFilterPatterns}
      columnTypeFilterPatterns={columnTypeFilterPatterns}
    >
      <ContextMenuFilterTemplate
        filterFields={onDemandFilterFields}
        filterFieldsOnDemand
        title="Context menu filter, FilterProvider columnFilterPatterns and columnTypeFilterPatterns"
        notes={
          <>
            The ColumnFilters are created only when shown, and have no{" "}
            <code>pattern</code> prop. The FilterProvider{" "}
            <code>columnTypeFilterPatterns</code> prop sets the pattern for{" "}
            <code>epochtimestamp</code> columns to{" "}
            <code>{`{ date: "dd MMM yyyy" }`}</code> and for{" "}
            <code>epochtimestampnano</code> columns to{" "}
            <code>{`{ time: "hh:mm:ss.ms" }`}</code>. The{" "}
            <code>columnFilterPatterns</code> prop overrides the latter for{" "}
            <code>execTime</code>, with <code>{`{ time: "hh:mm:ss" }`}</code>.
            Right click a cell before showing the filters: <code>execTime</code>{" "}
            (nanoseconds in the Table) is filtered to the whole second, today,
            and <code>tradeTime</code> (an <code>epochtimestamp</code>) to the
            whole day, as the ColumnFilters will display them.
          </>
        }
      />
    </FilterProvider>
  );
};

/**
 * Without ColumnFilters, filterPatterns can describe the precision of the
 * filter, otherwise the Table formatting is used.
 */
export const ContextMenuFilterPatterns = () => {
  const filterPatterns = useMemo<Record<string, DateTimePattern>>(
    () => ({ execTime: { date: "yyyy-mm-dd", time: "hh:mm:ss.ms" } }),
    [],
  );
  return (
    <FilterProvider>
      <ContextMenuFilterTemplate
        filterPatterns={filterPatterns}
        title="Context menu filter, filterPatterns"
        notes={
          <>
            There are no ColumnFilters here. The <code>filterPatterns</code>{" "}
            option of <code>useFilterContextMenu</code> sets the pattern for{" "}
            <code>execTime</code> to{" "}
            <code>{`{ date: "yyyy-mm-dd", time: "hh:mm:ss.ms" }`}</code>, so the
            filter matches the whole millisecond (on the day of the value,
            rather than today). Other columns are filtered at the precision
            displayed by the Table: the whole second for <code>tradeTime</code>,
            the whole millisecond for <code>legacyCreated</code>.
          </>
        }
      />
    </FilterProvider>
  );
};
