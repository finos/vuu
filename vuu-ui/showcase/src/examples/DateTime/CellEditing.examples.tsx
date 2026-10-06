import {
  DataEditingProvider,
  DirectEditSession,
} from "@vuu-ui/vuu-data-editing";
import { getDataItemEditControl } from "@vuu-ui/vuu-data-react";
import type { DataSource, DataValueDescriptor } from "@vuu-ui/vuu-data-types";
import type { RpcResult, VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import { TableCell } from "@vuu-ui/vuu-table";
import { dataRowFactory } from "@vuu-ui/vuu-table/src/data-row/DataRow";
import type {
  ColumnDescriptor,
  RuntimeColumnDescriptor,
} from "@vuu-ui/vuu-table-types";
import { VuuDatePicker } from "@vuu-ui/vuu-ui-controls";
import {
  type CommitHandler,
  EpochTimestamp,
  getCellRenderer,
  getTemporalInfo,
  getValueFormatter,
} from "@vuu-ui/vuu-utils";
import { Fragment, useCallback, useMemo, useState } from "react";
import { ExampleLayout, JsonValue } from "./date-time-templates";

const millis = 1710513045123; // 2024-03-15T14:30:45.123Z
const nanos = "1710513045123456789";
const lateEvening = 1710545400000; // 2024-03-15T23:30:00Z

type EditableColumn = ColumnDescriptor & { initialValue: VuuRowDataItemType };

const editableColumns: EditableColumn[] = [
  {
    name: "millisDateTime",
    label: "epochtimestamp",
    serverDataType: "epochtimestamp",
    initialValue: millis,
  },
  {
    name: "millisDate",
    label: "epochtimestamp, date",
    serverDataType: "epochtimestamp",
    type: "date",
    initialValue: millis,
  },
  {
    name: "millisTime",
    label: "epochtimestamp, time",
    serverDataType: "epochtimestamp",
    type: "time",
    initialValue: millis,
  },
  {
    name: "nanosDateTime",
    label: "epochtimestampnano",
    serverDataType: "epochtimestampnano",
    initialValue: nanos,
  },
  {
    name: "nanosTime",
    label: "epochtimestampnano, time",
    serverDataType: "epochtimestampnano",
    type: "time",
    initialValue: nanos,
  },
  {
    name: "legacyDateTime",
    label: "long, date/time",
    serverDataType: "long",
    type: "date/time",
    initialValue: millis,
  },
  {
    name: "utcDateTime",
    label: "epochtimestamp, UTC",
    serverDataType: "epochtimestamp",
    type: { name: "date/time", formatting: { timeZone: "UTC" } },
    initialValue: millis,
  },
  {
    name: "tokyoNanos",
    label: "nanos, Asia/Tokyo",
    serverDataType: "epochtimestampnano",
    type: { name: "date/time", formatting: { timeZone: "Asia/Tokyo" } },
    initialValue: nanos,
  },
];

const toRuntimeColumn = ({
  initialValue: _,
  ...column
}: EditableColumn): RuntimeColumnDescriptor => {
  const editableColumn: ColumnDescriptor = { ...column, editable: true };
  return {
    ...editableColumn,
    CellRenderer: getCellRenderer(editableColumn),
    valueFormatter: getValueFormatter(editableColumn),
    width: 240,
  } as unknown as RuntimeColumnDescriptor;
};

const EditableCell = ({
  column,
  onCommit,
  value,
}: {
  column: EditableColumn;
  onCommit: (name: string, value: VuuRowDataItemType) => void;
  value: VuuRowDataItemType;
}) => {
  const [DataRow] = useMemo(
    () =>
      dataRowFactory(
        [column.name],
        [
          {
            name: column.name,
            serverDataType: column.serverDataType ?? "long",
          },
        ],
      ),
    [column],
  );
  const runtimeColumn = useMemo(() => toRuntimeColumn(column), [column]);
  // prettier-ignore
  const dataRow = DataRow([0, 0, true, false, 1, 0, "key", 0, 0, false, value]);

  // Edits are committed via the TableEditSession provided to the cell. A
  // DirectEditSession over a stub editCell reports the committed (wire) value.
  const editSession = useMemo(
    () =>
      new DirectEditSession({
        dataSource: {
          editCell: async (
            _key: string,
            columnName: string,
            value: VuuRowDataItemType,
          ): Promise<RpcResult> => {
            onCommit(columnName, value);
            return { data: undefined, type: "SUCCESS_RESULT" };
          },
        } as unknown as DataSource,
      }),
    [onCommit],
  );

  return (
    <DataEditingProvider editSession={editSession}>
      <div style={{ height: 24, width: 240 }}>
        <TableCell column={runtimeColumn} dataRow={dataRow} />
      </div>
    </DataEditingProvider>
  );
};

/**
 * Editable temporal columns use the TemporalInputCell. Values are edited in a
 * canonical, locale independent format, in the column time zone, and
 * committed in the column encoding.
 */
export const EditableTemporalCells = () => {
  const [values, setValues] = useState<Record<string, VuuRowDataItemType>>(() =>
    Object.fromEntries(editableColumns.map((c) => [c.name, c.initialValue])),
  );
  const handleCommit = useCallback(
    (name: string, value: VuuRowDataItemType) =>
      setValues((current) => ({ ...current, [name]: value })),
    [],
  );

  return (
    <ExampleLayout
      title="Editable temporal cells"
      notes={
        <>
          Click a cell and type a value, Enter commits. Accepted input formats:
          <code> yyyy-mm-dd hh:mm:ss[.fffffffff]</code> (date/time),{" "}
          <code>yyyy-mm-dd</code> (date), <code>hh:mm[:ss[.fffffffff]]</code>{" "}
          (time, date is preserved) or a raw epoch value. Sub-millisecond
          precision of nano values is preserved unless edited. Committed values
          (right) are in the wire encoding: a number for millis, a digit string
          for nanos.
        </>
      }
    >
      <div
        style={{
          alignItems: "center",
          display: "grid",
          gap: "4px 16px",
          gridTemplateColumns: "200px 240px auto",
        }}
      >
        <strong>column</strong>
        <strong>cell (editable)</strong>
        <strong>committed wire value</strong>
        {editableColumns.map((column) => (
          <Fragment key={column.name}>
            <span>{column.label}</span>
            <EditableCell
              column={column}
              onCommit={handleCommit}
              value={values[column.name]}
            />
            <JsonValue
              testId={`value-${column.name}`}
              value={values[column.name]}
            />
          </Fragment>
        ))}
      </div>
    </ExampleLayout>
  );
};

type EditField = DataValueDescriptor & { initialValue?: VuuRowDataItemType };

const formFields: EditField[] = [
  {
    name: "tradeDate",
    label: "Date (epochtimestamp)",
    serverDataType: "epochtimestamp",
    type: "date",
    initialValue: millis,
  },
  {
    name: "tradeDateTime",
    label: "Date/time (epochtimestamp)",
    serverDataType: "epochtimestamp",
    initialValue: millis,
  },
  {
    name: "tradeTime",
    label: "Time (epochtimestamp)",
    serverDataType: "epochtimestamp",
    type: "time",
    initialValue: millis,
  },
  {
    name: "execDateTime",
    label: "Date/time (epochtimestampnano)",
    serverDataType: "epochtimestampnano",
    initialValue: nanos,
  },
  {
    name: "execTime",
    label: "Time (epochtimestampnano)",
    serverDataType: "epochtimestampnano",
    type: "time",
    initialValue: nanos,
  },
  {
    name: "legacy",
    label: "Date (long, date)",
    serverDataType: "long",
    type: "date",
    initialValue: millis,
  },
  {
    name: "newDate",
    label: "Date, no initial value",
    serverDataType: "epochtimestamp",
    type: "date",
  },
];

const EditControlRow = ({ field }: { field: EditField }) => {
  const [value, setValue] = useState<VuuRowDataItemType | undefined>(
    field.initialValue,
  );
  const formatter = useMemo(
    () => getValueFormatter(field as ColumnDescriptor),
    [field],
  );
  const handleCommit = useCallback<CommitHandler<HTMLElement>>(
    (_evt, newValue) => setValue(newValue as VuuRowDataItemType),
    [],
  );
  return (
    <>
      <span>{field.label}</span>
      <div style={{ width: 220 }}>
        {getDataItemEditControl({
          InputProps: {
            inputProps: {
              value: value === undefined ? "" : `${value}`,
            },
          },
          dataDescriptor: { ...field, editable: true },
          onCommit: handleCommit,
        })}
      </div>
      <span>{formatter(value)}</span>
      <JsonValue testId={`value-${field.name}`} value={value} />
    </>
  );
};

/**
 * getDataItemEditControl provides the control used by forms (and filters)
 * to edit a value. Temporal fields are edited with a date picker or a time
 * picker, according to their kind.
 */
export const TemporalEditControls = () => (
  <ExampleLayout
    title="Temporal edit controls (forms)"
    notes={
      <>
        Date and date/time fields use VuuDatePicker. Choosing a date for a
        date/time field preserves its time of day (and sub-millisecond nanos).
        Time fields use VuuTimePicker, the edited time is applied to the date of
        the existing value. Committed values are in the wire encoding.
      </>
    }
  >
    <div
      style={{
        alignItems: "center",
        display: "grid",
        gap: "8px 16px",
        gridTemplateColumns: "220px 220px 260px auto",
      }}
    >
      <strong>field</strong>
      <strong>control</strong>
      <strong>formatted</strong>
      <strong>committed wire value</strong>
      {formFields.map((field) => (
        <EditControlRow field={field} key={field.name} />
      ))}
    </div>
  </ExampleLayout>
);

const pickerTimeZones = ["local", "UTC", "America/New_York", "Asia/Tokyo"];

/**
 * VuuDatePicker commits the start of the selected day, in its timeZone.
 */
export const DatePickerTimeZones = () => {
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(pickerTimeZones.map((tz) => [tz, lateEvening])),
  );
  return (
    <ExampleLayout
      title="VuuDatePicker and time zones"
      notes={
        <>
          The same timestamp (2024-03-15T23:30:00Z) presented in different time
          zones. In Asia/Tokyo it is already the 16th. Selecting a date commits
          epoch millis at the start of that day, in the picker time zone.
        </>
      }
    >
      <div
        style={{
          alignItems: "center",
          display: "grid",
          gap: "8px 16px",
          gridTemplateColumns: "160px 200px auto",
        }}
      >
        {pickerTimeZones.map((timeZone) => (
          <Fragment key={timeZone}>
            <span>{timeZone}</span>
            <VuuDatePicker
              onCommit={(_e, value) =>
                setValues((v) => ({ ...v, [timeZone]: value }))
              }
              timeZone={timeZone}
              value={values[timeZone]}
            />
            <span style={{ fontFamily: "monospace", fontSize: 12 }}>
              {values[timeZone]} ={" "}
              {EpochTimestamp.fromMillis(values[timeZone]).toString()}
            </span>
          </Fragment>
        ))}
      </div>
    </ExampleLayout>
  );
};

/**
 * The canonical edit format of a value, per column configuration.
 */
export const TemporalInfoByColumn = () => {
  const columns: ColumnDescriptor[] = [
    { name: "a", serverDataType: "epochtimestamp" },
    { name: "b", serverDataType: "epochtimestamp", type: "date" },
    { name: "c", serverDataType: "epochtimestamp", type: "time" },
    { name: "d", serverDataType: "epochtimestamp", type: "number" },
    { name: "e", serverDataType: "epochtimestampnano" },
    { name: "f", serverDataType: "epochtimestampnano", type: "time" },
    { name: "g", serverDataType: "long" },
    { name: "h", serverDataType: "long", type: "date/time" },
    { name: "i", serverDataType: "long", type: "time" },
    {
      name: "j",
      serverDataType: "long",
      type: { name: "date", formatting: { timeZone: "UTC" } },
    },
    { name: "k", serverDataType: "string", type: "time" },
  ];
  return (
    <ExampleLayout
      title="getTemporalInfo"
      notes={
        <>
          getTemporalInfo is the single source of truth for whether, and how, a
          column holds a temporal value. Encoding comes from serverDataType,
          kind from type. A string column is never temporal.
        </>
      }
    >
      <div
        style={{
          display: "grid",
          fontFamily: "monospace",
          fontSize: 12,
          gap: "4px 16px",
          gridTemplateColumns: "auto auto",
        }}
      >
        <strong>column</strong>
        <strong>temporalInfo</strong>
        {columns.map(({ name, ...column }) => (
          <Fragment key={name}>
            <span>{JSON.stringify(column)}</span>
            <span>
              {JSON.stringify(getTemporalInfo(column)) ?? "undefined"}
            </span>
          </Fragment>
        ))}
      </div>
    </ExampleLayout>
  );
};
