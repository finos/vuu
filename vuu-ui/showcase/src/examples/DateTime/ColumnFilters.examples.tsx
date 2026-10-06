import { FormField, FormFieldLabel } from "@salt-ds/core";
import type {
  ColumnFilterCommitHandler,
  ColumnFilterOp,
  ColumnFilterValue,
  ExtendedFilterOptions,
  FilterContainerFilter,
} from "@vuu-ui/vuu-filter-types";
import {
  ColumnFilter,
  type FilterAppliedHandler,
  FilterContainer,
  FilterContainerColumnFilter,
  FilterDisplay,
} from "@vuu-ui/vuu-filters";
import { DataSourceStats } from "@vuu-ui/vuu-table-extras";
import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import {
  DataSourceProvider,
  type DateTimePattern,
  filterAsQuery,
} from "@vuu-ui/vuu-utils";
import { useCallback, useMemo, useState } from "react";
import {
  createDateTimeDataSource,
  type ExampleColumn,
  toColumnDescriptor,
} from "./date-time-data";
import { DateTimeTable, ExampleLayout, JsonValue } from "./date-time-templates";

interface FilterField {
  column: ExampleColumn;
  extendedFilterOptions?: ExtendedFilterOptions;
  label: string;
  operator?: ColumnFilterOp;
  pattern?: DateTimePattern;
}

const tableColumnsFor = (fields: FilterField[]): ExampleColumn[] => [
  { name: "id", serverDataType: "string", width: 60 },
  { name: "ccy", serverDataType: "string", width: 60 },
  ...fields
    .map((f) => f.column)
    .filter((col, i, cols) => cols.findIndex((c) => c.name === col.name) === i),
];

const FilterContainerTemplate = ({
  fields,
  width = 1200,
}: {
  fields: FilterField[];
  width?: number;
}) => {
  const tableColumns = useMemo(() => tableColumnsFor(fields), [fields]);
  const columnDescriptors = useMemo(
    () => tableColumns.map(toColumnDescriptor),
    [tableColumns],
  );
  const filterColumns = useMemo(
    () =>
      fields.map((field) => ({
        ...field,
        column: toColumnDescriptor(field.column),
      })),
    [fields],
  );
  const dataSource = useMemo(
    () => createDateTimeDataSource(tableColumns),
    [tableColumns],
  );
  const [filter, setFilter] = useState<FilterContainerFilter | undefined>();

  const onFilterApplied = useCallback<
    FilterAppliedHandler<FilterContainerFilter>
  >(
    (filter) => {
      dataSource.setFilter(filter);
      setFilter(filter);
    },
    [dataSource],
  );
  const onFilterCleared = useCallback(() => {
    dataSource.clearFilter();
    setFilter(undefined);
  }, [dataSource]);

  return (
    <DataSourceProvider dataSource={dataSource}>
      <div style={{ display: "flex", gap: 24 }}>
        <FilterContainer
          filter={filter}
          onFilterApplied={onFilterApplied}
          onFilterCleared={onFilterCleared}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            width: 300,
          }}
        >
          {filterColumns.map(
            ({ column, extendedFilterOptions, label, operator, pattern }) => (
              <FormField key={`${column.name}-${label}`}>
                <FormFieldLabel>{label}</FormFieldLabel>
                <FilterContainerColumnFilter
                  column={column}
                  extendedFilterOptions={extendedFilterOptions}
                  operator={operator}
                  pattern={pattern}
                />
              </FormField>
            ),
          )}
        </FilterContainer>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            width: 500,
          }}
        >
          <FilterDisplay columns={columnDescriptors} filter={filter} />
          <JsonValue label="filter" value={filter} />
          <JsonValue
            label="query"
            testId="filter-query"
            value={dataSource.filter.filter}
          />
        </div>
      </div>
      <DateTimeTable
        columns={tableColumns}
        dataSource={dataSource}
        height={360}
        width={width}
      />
      <DataSourceStats dataSource={dataSource} />
    </DataSourceProvider>
  );
};

/**
 * Date filters, applied to timestamps, match the whole day (in the column
 * time zone).
 */
export const DateColumnFilters = () => {
  const fields = useMemo<FilterField[]>(
    () => [
      {
        column: {
          name: "tradeDate",
          type: { name: "date", formatting: { timeZone: "UTC" } },
        },
        label: "Trade date (=, UTC date)",
      },
      {
        column: { name: "tradeTime", type: "date/time" },
        label: "Trade time (=, whole day)",
      },
      {
        column: { name: "execTime" },
        label: "Exec time, nanos (between-inclusive)",
        operator: "between-inclusive",
      },
      {
        column: {
          name: "legacyCreated",
          serverDataType: "long",
          type: "date/time",
        },
        label: "Legacy created, long (>)",
        operator: ">",
      },
    ],
    [],
  );
  return (
    <ExampleLayout
      title="Date column filters"
      notes={
        <>
          A date applied to a timestamp column is a range covering the whole
          day, in the column time zone: <code>=</code> is{" "}
          <code>&gt;= start and &lt; next day</code>, <code>&gt;</code> is{" "}
          <code>&gt;= next day</code>, <code>between-inclusive</code> covers
          both end days completely. Nano columns are queried with nano values.
          tradeDate holds UTC midnight values, so it is configured with a UTC
          time zone.
        </>
      }
    >
      <FilterContainerTemplate fields={fields} />
    </ExampleLayout>
  );
};

/**
 * Time filters use a TimeString value (hh:mm:ss) that is resolved, when the
 * filter is applied, against a date ('today' by default).
 */
export const TimeColumnFilters = () => {
  const fields = useMemo<FilterField[]>(
    () => [
      {
        column: { name: "tradeTime", type: "time" },
        label: "Trade time today (between)",
        operator: "between",
      },
      {
        column: { name: "execTime", type: "time" },
        label: "Exec time today, nanos (>)",
        operator: ">",
      },
      {
        column: {
          name: "legacyCreated",
          serverDataType: "long",
          type: "time",
        },
        label: "Legacy created today, long (<)",
        operator: "<",
      },
    ],
    [],
  );
  return (
    <ExampleLayout
      title="Time column filters (today)"
      notes={
        <>
          Time filters are held as TimeString values, in an extended filter
          clause carrying the column encoding and time zone. The query is
          resolved against today when the filter is applied, so a saved filter
          remains a filter on &apos;today&apos;. An <code>=</code> time filter
          matches the whole second.
        </>
      }
    >
      <FilterContainerTemplate fields={fields} />
    </ExampleLayout>
  );
};

export const TimeColumnFiltersOtherDays = () => {
  const yesterday = useMemo<ExtendedFilterOptions>(
    () => ({ type: "TimeString", date: "yesterday" }),
    [],
  );
  const twoDaysAgo = useMemo<ExtendedFilterOptions>(() => {
    const d = new Date(Date.now() - 2 * 86_400_000);
    const pad = (n: number) => `${n}`.padStart(2, "0");
    return {
      type: "TimeString",
      date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` as `${number}-${number}-${number}`,
    };
  }, []);
  const tokyo = useMemo<ExtendedFilterOptions>(
    () => ({ type: "TimeString", date: "today", timeZone: "Asia/Tokyo" }),
    [],
  );

  const fields = useMemo<FilterField[]>(
    () => [
      {
        column: { name: "tradeTime", type: "time" },
        extendedFilterOptions: yesterday,
        label: "Trade time yesterday (between)",
        operator: "between",
      },
      {
        column: { name: "execTime", type: "time" },
        extendedFilterOptions: twoDaysAgo,
        label: `Exec time on ${twoDaysAgo.date} (>)`,
        operator: ">",
      },
      {
        column: {
          name: "legacyCreated",
          serverDataType: "long",
          type: "time",
        },
        extendedFilterOptions: tokyo,
        label: "Legacy created, today in Tokyo (>)",
        operator: ">",
      },
    ],
    [tokyo, twoDaysAgo, yesterday],
  );
  return (
    <ExampleLayout
      title="Time column filters (other days, other time zones)"
      notes={
        <>
          <code>extendedFilterOptions</code> can specify the date a time filter
          applies to (&apos;today&apos;, &apos;yesterday&apos; or an ISO date)
          and the time zone in which the time is interpreted.
        </>
      }
    >
      <FilterContainerTemplate fields={fields} />
    </ExampleLayout>
  );
};

/**
 * A standalone ColumnFilter, the committed values and the filter query each
 * would produce.
 */
/**
 * The Table and ColumnFilter can use different patterns for the same column.
 */
export const FilterPatternOverride = () => {
  const fields = useMemo<FilterField[]>(
    () => [
      {
        column: {
          name: "execTime",
          type: {
            name: "date/time",
            formatting: { pattern: { date: "yyyy-mm-dd", time: "hh:mm:ss" } },
          },
          width: 260,
        },
        label: "Exec time today, milliseconds (between)",
        operator: "between",
        pattern: { time: "hh:mm:ss.ms" },
      },
      {
        column: {
          name: "tradeTime",
          type: {
            name: "date/time",
            formatting: { pattern: { date: "dd MMM yyyy", time: "hh:mm:ss" } },
          },
          width: 200,
        },
        label: "Trade date (=)",
        pattern: { date: "dd MMM yyyy" },
      },
    ],
    [],
  );
  return (
    <ExampleLayout
      title="Filter pattern override"
      notes={
        <>
          The <code>pattern</code> prop of ColumnFilter (and
          FilterContainerColumnFilter) overrides the pattern configured on the
          column. Here the Table shows <code>execTime</code> (an{" "}
          <code>epochtimestampnano</code> column) as date and time with
          nanoseconds, while the filter accepts a time of day today, with
          milliseconds (<code>{`{ time: "hh:mm:ss.ms" }`}</code>). A time only
          pattern renders a time picker, a pattern with a date renders a date
          picker.
        </>
      }
    >
      <FilterContainerTemplate fields={fields} />
    </ExampleLayout>
  );
};

export const StandaloneTemporalColumnFilters = () => {
  const columns = useMemo<
    { column: ColumnDescriptor; operator: ColumnFilterOp }[]
  >(
    () => [
      {
        column: { name: "tradeTime", serverDataType: "epochtimestamp" },
        operator: "=",
      },
      {
        column: {
          name: "tradeDate",
          serverDataType: "epochtimestamp",
          type: "date",
        },
        operator: "between",
      },
      {
        column: {
          name: "execTime",
          serverDataType: "epochtimestampnano",
          type: "time",
        },
        operator: ">",
      },
      {
        column: {
          name: "execTime",
          serverDataType: "epochtimestampnano",
        },
        operator: "<",
      },
    ],
    [],
  );
  const [commits, setCommits] = useState<
    { column: string; op: string; value: ColumnFilterValue; query: string }[]
  >([]);

  const handleCommit = useCallback<ColumnFilterCommitHandler>(
    (column, op, value) => {
      let query = "";
      try {
        query =
          Array.isArray(value) || op === "between" || op === "between-inclusive"
            ? "(range, see FilterContainer examples)"
            : filterAsQuery({ column: column.name, op, value } as never, {
                columnsByName: { [column.name]: column },
              });
      } catch (e) {
        query = String(e);
      }
      setCommits((c) => [
        { column: column.name, op, value, query },
        ...c.slice(0, 9),
      ]);
    },
    [],
  );

  return (
    <ExampleLayout
      title="Standalone temporal column filters"
      notes={
        <>
          ColumnFilter renders a date picker or time picker for temporal
          columns. Date values are committed in the column encoding (epoch
          millis number or epoch nanos string) at the start of the day, time
          values as a TimeString.
        </>
      }
    >
      <div style={{ display: "flex", gap: 24 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            width: 300,
          }}
        >
          {columns.map(({ column, operator }) => (
            <FormField key={`${column.name}-${operator}`}>
              <FormFieldLabel>{`${column.name} ${column.serverDataType} ${column.type ?? ""} (${operator})`}</FormFieldLabel>
              <ColumnFilter
                column={column}
                onCommit={handleCommit}
                operator={operator}
              />
            </FormField>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <strong>Commits (most recent first)</strong>
          {commits.map((commit, i) => (
            <JsonValue key={i} value={commit} />
          ))}
        </div>
      </div>
    </ExampleLayout>
  );
};
