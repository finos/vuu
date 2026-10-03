import type {
  Filter,
  FilterClause as FilterClauseType,
} from "@vuu-ui/vuu-filter-types";
import {
  ExtendedSingleValueFilterClause,
  FilterClause,
  FilterClauseModel,
  type FilterEditCancelHandler,
  FilterEditor,
  type FilterEditSaveHandler,
  FilterPill,
} from "@vuu-ui/vuu-filters";
import {
  DataSourceProvider,
  filterAsQuery,
  formatTemporalFilterValue,
  getColumnsByName,
  setDefaultTimeZone,
  getDefaultTimeZone,
} from "@vuu-ui/vuu-utils";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
  createDateTimeDataSource,
  type ExampleColumn,
  toColumnDescriptor,
} from "./date-time-data";
import { DateTimeTable, ExampleLayout, JsonValue } from "./date-time-templates";

const vuuTable = { module: "TEST", table: "DateTime" };

const filterColumns: ExampleColumn[] = [
  { name: "id", serverDataType: "string", width: 60 },
  { name: "ccy", serverDataType: "string", width: 60 },
  {
    name: "tradeDate",
    label: "Trade date",
    type: { name: "date", formatting: { timeZone: "UTC" } },
  },
  { name: "tradeTime", label: "Trade time" },
  {
    name: "tradeTimeOfDay",
    sourceColumn: "tradeTime",
    label: "Trade time of day",
    type: "time",
  },
  { name: "execTime", label: "Exec time (nanos)", width: 260 },
  {
    name: "execTimeOfDay",
    sourceColumn: "execTime",
    label: "Exec time of day (nanos)",
    type: "time",
  },
  {
    name: "legacyCreated",
    label: "Legacy created",
    serverDataType: "long",
    type: "date/time",
  },
];

const columnDescriptors = filterColumns.map(toColumnDescriptor);
const columnsByName = getColumnsByName(columnDescriptors);

const QueryForClause = ({ model }: { model: FilterClauseModel }) => {
  const [clause, setClause] = useState<Partial<FilterClauseType>>(
    model.asFilter(false),
  );
  useEffect(() => {
    const handler = (clause: Partial<FilterClauseType>) =>
      setClause({ ...clause });
    model.on("filterClause", handler);
    return () => {
      model.removeListener("filterClause", handler);
    };
  }, [model]);

  let query = "";
  if (model.isValid) {
    try {
      query = filterAsQuery(clause as Filter, { columnsByName });
    } catch (e) {
      query = String(e);
    }
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <JsonValue label="clause" value={clause} />
      <JsonValue label="query" testId="query" value={query} />
    </div>
  );
};

const FilterClauseTemplate = ({
  filterClause = {},
}: {
  filterClause?: Partial<FilterClauseType>;
}) => {
  const dataSource = useMemo(() => createDateTimeDataSource(filterColumns), []);
  const model = useMemo(
    () => new FilterClauseModel(filterClause),
    [filterClause],
  );
  return (
    <DataSourceProvider dataSource={dataSource}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <FilterClause
          columnsByName={columnsByName}
          filterClauseModel={model}
          vuuTable={vuuTable}
        />
        <QueryForClause model={model} />
      </div>
    </DataSourceProvider>
  );
};

const clauseNotes = (
  <>
    Pick a temporal column: date and date/time columns present a date picker,
    time columns a time picker. The query shows how the clause is serialised for
    the server: whole-day ranges for dates, nano values for epochtimestampnano
    columns, time values resolved against today.
  </>
);

export const NewTemporalFilterClause = () => (
  <ExampleLayout
    title="New filter clause, temporal columns"
    notes={clauseNotes}
  >
    <FilterClauseTemplate />
  </ExampleLayout>
);

export const DateFilterClause = () => {
  const filterClause = useMemo<Partial<FilterClauseType>>(
    () => ({ column: "tradeTime", op: "=", value: Date.UTC(2024, 2, 15) }),
    [],
  );
  return (
    <ExampleLayout
      title="Date clause on an epochtimestamp column"
      notes={clauseNotes}
    >
      <FilterClauseTemplate filterClause={filterClause} />
    </ExampleLayout>
  );
};

export const NanoDateFilterClause = () => {
  const filterClause = useMemo<Partial<FilterClauseType>>(
    () => ({
      column: "execTime",
      op: ">",
      value: `${BigInt(Date.UTC(2024, 2, 15)) * 1_000_000n}`,
    }),
    [],
  );
  return (
    <ExampleLayout
      title="Date clause on an epochtimestampnano column"
      notes={clauseNotes}
    >
      <FilterClauseTemplate filterClause={filterClause} />
    </ExampleLayout>
  );
};

export const TimeFilterClause = () => {
  const filterClause = useMemo<Partial<FilterClauseType>>(
    () => ({ column: "tradeTimeOfDay", op: ">", value: "09:30:00" }),
    [],
  );
  return (
    <ExampleLayout title="Time clause (today)" notes={clauseNotes}>
      <FilterClauseTemplate filterClause={filterClause} />
    </ExampleLayout>
  );
};

/**
 * The FilterEditor, with temporal columns, applied to a table.
 */
export const TemporalFilterEditor = () => {
  const dataSource = useMemo(() => createDateTimeDataSource(filterColumns), []);
  const [filter, setFilter] = useState<Filter | undefined>({
    op: "and",
    filters: [
      { column: "tradeTime", op: ">", value: startOfToday() - 2 * 86_400_000 },
      { column: "tradeTimeOfDay", op: "<", value: "12:00:00" },
    ],
  });

  useEffect(() => {
    if (filter) {
      dataSource.setFilter(filter);
    } else {
      dataSource.clearFilter();
    }
  }, [dataSource, filter]);

  const onCancel = useCallback<FilterEditCancelHandler>(() => undefined, []);
  const onSave = useCallback<FilterEditSaveHandler>((f) => setFilter(f), []);

  return (
    <ExampleLayout
      title="FilterEditor with temporal columns"
      notes={
        <>
          Edit, then save, the filter. It is applied to the table below. The
          pill tooltip and the query show how temporal values are presented and
          serialised.
        </>
      }
    >
      <DataSourceProvider dataSource={dataSource}>
        <FilterEditor
          columnDescriptors={columnDescriptors}
          filter={filter}
          key={JSON.stringify(filter)}
          onCancel={onCancel}
          onSave={onSave}
          style={{ background: "var(--salt-container-secondary-background)" }}
          vuuTable={vuuTable}
        />
      </DataSourceProvider>
      {filter ? (
        <div>
          <FilterPill
            columnsByName={columnsByName}
            filter={filter}
            selected={false}
          />
        </div>
      ) : null}
      <JsonValue label="query" value={dataSource.filter.filter} />
      <DateTimeTable
        columns={filterColumns}
        dataSource={dataSource}
        height={360}
        width={1500}
      />
    </ExampleLayout>
  );
};

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const day = Date.UTC(2024, 2, 15);
const dayNanos = `${BigInt(day) * 1_000_000n}`;
const instant = day + 14 * 3_600_000 + 30 * 60_000 + 45_123;
const instantNanos = `${BigInt(instant) * 1_000_000n + 456_789n}`;

interface QueryExample {
  description: string;
  filter: Filter;
}

const queryExamples: QueryExample[] = [
  {
    description: "date = (whole day)",
    filter: { column: "tradeTime", op: "=", value: day },
  },
  {
    description: "date != (outside day)",
    filter: { column: "tradeTime", op: "!=", value: day },
  },
  {
    description: "date > (from next day)",
    filter: { column: "tradeTime", op: ">", value: day },
  },
  {
    description: "date <= (until end of day)",
    filter: { column: "tradeTime", op: "<=", value: day },
  },
  {
    description: "instant = (exact)",
    filter: { column: "tradeTime", op: "=", value: instant },
  },
  {
    description: "nano date = (whole day)",
    filter: { column: "execTime", op: "=", value: dayNanos },
  },
  {
    description: "nano instant > (exact)",
    filter: { column: "execTime", op: ">", value: instantNanos },
  },
  {
    description: "UTC date column",
    filter: { column: "tradeDate", op: "=", value: day },
  },
  {
    description: "legacy long, date/time",
    filter: { column: "legacyCreated", op: ">=", value: day },
  },
  {
    description: "time of day (today)",
    filter: { column: "tradeTimeOfDay", op: ">", value: "09:30:00" },
  },
  {
    description: "time of day = (whole second)",
    filter: { column: "tradeTimeOfDay", op: "=", value: "09:30:00" },
  },
  {
    description: "nano time of day (today)",
    filter: { column: "execTimeOfDay", op: "<", value: "16:00:00.5" },
  },
  {
    description: "date range",
    filter: {
      op: "and",
      filters: [
        { column: "tradeTime", op: ">=", value: day },
        { column: "tradeTime", op: "<=", value: day + 2 * 86_400_000 },
      ],
    },
  },
  {
    description: "extended clause, time yesterday",
    filter: new ExtendedSingleValueFilterClause(
      "tradeTimeOfDay",
      ">",
      "09:30:00",
      { type: "TimeString", date: "yesterday" },
    ),
  },
  {
    description: "extended clause, nanos, 2024-03-15 in Tokyo",
    filter: new ExtendedSingleValueFilterClause("execTime", "<", "09:30:00", {
      type: "TimeString",
      date: "2024-03-15",
      encoding: "epochNanos",
      timeZone: "Asia/Tokyo",
    }),
  },
];

const describeValue = (filter: Filter): string => {
  if ("column" in filter && "value" in filter) {
    const column = columnsByName[filter.column];
    return column
      ? formatTemporalFilterValue(filter.value, column)
      : String(filter.value);
  } else if ("filters" in filter) {
    return filter.filters.map(describeValue).join(" , ");
  }
  return "";
};

/**
 * How temporal filters are serialised for the server, and presented to the
 * user, for each column configuration.
 */
export const TemporalFilterQueries = () => {
  const [timeZone, setTimeZone] = useState(getDefaultTimeZone());
  useEffect(() => {
    const initial = getDefaultTimeZone();
    return () => setDefaultTimeZone(initial);
  }, []);
  const toggleTimeZone = () => {
    const tz = timeZone === "UTC" ? "local" : "UTC";
    setDefaultTimeZone(tz);
    setTimeZone(tz);
  };

  return (
    <ExampleLayout
      title="Temporal filter queries"
      notes={
        <>
          Filter structures (as held by the UI) and the query string sent to the
          server. Dates applied to timestamps become ranges, in the column time
          zone (application default: <strong>{timeZone}</strong>,{" "}
          <button onClick={toggleTimeZone} type="button">
            toggle UTC/local
          </button>
          ). Column configuration:{" "}
          <code>
            {JSON.stringify(
              columnDescriptors.map(({ name, serverDataType, type }) => ({
                name,
                serverDataType,
                type,
              })),
            )}
          </code>
        </>
      }
    >
      <div
        key={timeZone}
        style={{
          display: "grid",
          fontFamily: "monospace",
          fontSize: 12,
          gap: "6px 16px",
          gridTemplateColumns: "200px 420px 200px auto",
          overflowWrap: "anywhere",
        }}
      >
        <strong>example</strong>
        <strong>filter</strong>
        <strong>display value</strong>
        <strong>query</strong>
        {queryExamples.map(({ description, filter }) => {
          let query: string;
          try {
            query = filterAsQuery(filter, { columnsByName });
          } catch (e) {
            query = String(e);
          }
          return (
            <Fragment key={description}>
              <span>{description}</span>
              <JsonValue value={filter} />
              <span>{describeValue(filter)}</span>
              <span data-testid="query">{query}</span>
            </Fragment>
          );
        })}
      </div>
    </ExampleLayout>
  );
};

export const TemporalFilterPills = () => {
  const filters = useMemo<Filter[]>(
    () => queryExamples.map(({ filter }) => filter),
    [],
  );
  return (
    <ExampleLayout
      title="Filter pills with temporal filters"
      notes="Hover a pill to see the tooltip, temporal values are formatted for the column."
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {filters.map((filter, i) => (
          <FilterPill
            columnsByName={columnsByName}
            filter={filter}
            selected={false}
            key={i}
          />
        ))}
      </div>
    </ExampleLayout>
  );
};
