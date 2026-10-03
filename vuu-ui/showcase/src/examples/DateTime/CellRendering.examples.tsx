import {
  Button,
  Dropdown,
  FormField,
  FormFieldLabel,
  Input,
  Option,
} from "@salt-ds/core";
import type { DataValueTypeSimple } from "@vuu-ui/vuu-data-types";
import { TableCell } from "@vuu-ui/vuu-table";
import { dataRowFactory } from "@vuu-ui/vuu-table/src/data-row/DataRow";
import type {
  ColumnDescriptor,
  ColumnTypeFormatting,
  FractionalSecondDigits,
  RuntimeColumnDescriptor,
} from "@vuu-ui/vuu-table-types";
import { ColumnFormattingPanel } from "@vuu-ui/vuu-table-extras";
import {
  type CellRendererDescriptor,
  type DatePattern,
  EpochTimestamp,
  formatTemporalInput,
  getCellRenderer,
  getDefaultTimeZone,
  getTemporalInfo,
  getValueFormatter,
  setDefaultTimeZone,
  supportedDateTimePatterns,
  type TimePattern,
  updateColumnFormatting,
  updateColumnType,
} from "@vuu-ui/vuu-utils";
import {
  type ChangeEvent,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ExampleColumn } from "./date-time-data";
import { DateTimeTable, ExampleLayout } from "./date-time-templates";

/**
 * The 'kind' of temporal value presented (date, time or date and time) is
 * determined by the column 'type'. How the value is encoded is determined
 * by the serverDataType.
 */
export const TemporalKinds = () => {
  const columns = useMemo<ExampleColumn[]>(
    () => [
      { name: "id", serverDataType: "string", width: 60 },
      { name: "tradeTime", label: "epochtimestamp (default)" },
      {
        name: "tradeTimeDateTime",
        sourceColumn: "tradeTime",
        label: "epochtimestamp, date/time",
        type: "date/time",
      },
      {
        name: "tradeTimeDate",
        sourceColumn: "tradeTime",
        label: "epochtimestamp, date",
        type: "date",
      },
      {
        name: "tradeTimeTime",
        sourceColumn: "tradeTime",
        label: "epochtimestamp, time",
        type: "time",
      },
      {
        name: "tradeTimeNumber",
        sourceColumn: "tradeTime",
        label: "epochtimestamp, number (opt out)",
        type: "number",
      },
      { name: "execTime", label: "epochtimestampnano (default)", width: 260 },
      {
        name: "execTimeDate",
        sourceColumn: "execTime",
        label: "epochtimestampnano, date",
        type: "date",
      },
      {
        name: "execTimeTime",
        sourceColumn: "execTime",
        label: "epochtimestampnano, time",
        type: "time",
      },
    ],
    [],
  );
  return (
    <ExampleLayout
      title="Temporal kinds"
      notes={
        <>
          serverDataType determines the encoding (epochtimestamp: epoch millis
          number, epochtimestampnano: epoch nanos string). The column type
          determines what is displayed: <code>date/time</code> (the default),{" "}
          <code>date</code> or <code>time</code>. A type of <code>number</code>{" "}
          opts an epochtimestamp column out of temporal treatment. Nano values
          show 9 fractional second digits by default when time is displayed.
        </>
      }
    >
      <DateTimeTable columns={columns} width={1700} />
    </ExampleLayout>
  );
};

/**
 * Before epochtimestamp, timestamps could only be described by the server
 * as 'long'. Only the column 'type' can identify these as temporal.
 */
export const LegacyLongTimestamps = () => {
  const columns = useMemo<ExampleColumn[]>(
    () => [
      { name: "id", serverDataType: "string", width: 60 },
      {
        name: "legacyCreated",
        label: "long, no type",
        serverDataType: "long",
      },
      {
        name: "legacyDateTime",
        sourceColumn: "legacyCreated",
        label: "long, date/time",
        serverDataType: "long",
        type: "date/time",
      },
      {
        name: "legacyDate",
        sourceColumn: "legacyCreated",
        label: "long, date",
        serverDataType: "long",
        type: "date",
      },
      {
        name: "legacyTime",
        sourceColumn: "legacyCreated",
        label: "long, time",
        serverDataType: "long",
        type: "time",
      },
      {
        name: "legacyPattern",
        sourceColumn: "legacyCreated",
        label: "long, pattern",
        serverDataType: "long",
        type: {
          name: "date/time",
          formatting: { pattern: { date: "dd MMM yyyy", time: "hh:mm:ss a" } },
        },
        width: 220,
      },
    ],
    [],
  );
  return (
    <ExampleLayout
      title="Legacy long timestamps"
      notes={
        <>
          A long column is treated as a number unless a temporal type is
          specified. With a temporal type, it behaves exactly as an
          epochtimestamp column, in rendering, editing and filtering.
        </>
      }
    >
      <DateTimeTable columns={columns} width={1100} />
    </ExampleLayout>
  );
};

const datePatterns = supportedDateTimePatterns.date;
const timePatterns = supportedDateTimePatterns.time;

export const DateAndTimePatterns = () => {
  const columns = useMemo<ExampleColumn[]>(
    () => [
      { name: "id", serverDataType: "string", width: 60 },
      ...datePatterns.map<ExampleColumn>((date, i) => ({
        name: `datePattern${i}`,
        sourceColumn: "tradeTime",
        label: date,
        type: { name: "date", formatting: { pattern: { date } } },
        width: 150,
      })),
      ...timePatterns.map<ExampleColumn>((time, i) => ({
        name: `timePattern${i}`,
        sourceColumn: "tradeTime",
        label: time,
        type: { name: "time", formatting: { pattern: { time } } },
        width: 130,
      })),
      {
        name: "combined",
        sourceColumn: "tradeTime",
        label: "MMMM dd, yyyy hh:mm:ss a",
        type: {
          name: "date/time",
          formatting: {
            pattern: { date: "MMMM dd, yyyy", time: "hh:mm:ss a" },
          },
        },
        width: 240,
      },
    ],
    [],
  );
  return (
    <ExampleLayout
      title="Date and time patterns"
      notes={
        <>
          Each supported date and time pattern applied to the same
          epochtimestamp value. Date patterns imply a locale (e.g.{" "}
          <code>mm/dd/yyyy</code> is en-US), which can be overridden.
        </>
      }
    >
      <DateTimeTable columns={columns} width={1950} />
    </ExampleLayout>
  );
};

const timeZones = [
  "local",
  "UTC",
  "Europe/London",
  "America/New_York",
  "Asia/Tokyo",
  "Australia/Sydney",
];

export const TimeZones = () => {
  const columns = useMemo<ExampleColumn[]>(
    () => [
      { name: "id", serverDataType: "string", width: 60 },
      ...timeZones.map<ExampleColumn>((timeZone, i) => ({
        name: `tradeTimeTz${i}`,
        sourceColumn: "tradeTime",
        label: `tradeTime ${timeZone}`,
        type: {
          name: "date/time",
          formatting: {
            pattern: { date: "yyyy-mm-dd", time: "hh:mm:ss" },
            timeZone,
          },
        },
      })),
      {
        name: "tradeDateLocal",
        sourceColumn: "tradeDate",
        label: "tradeDate (date, local)",
        type: "date",
      },
      {
        name: "tradeDateUTC",
        sourceColumn: "tradeDate",
        label: "tradeDate (date, UTC)",
        type: { name: "date", formatting: { timeZone: "UTC" } },
      },
    ],
    [],
  );
  return (
    <ExampleLayout
      title="Time zones"
      notes={
        <>
          The same instant, rendered in different time zones. Values are
          rendered in the application default time zone (local, unless
          configured) unless a column specifies a timeZone. tradeDate holds UTC
          start-of-day values; it should be rendered with a UTC time zone or,
          west of Greenwich, it shows the previous day.
        </>
      }
    >
      <DateTimeTable columns={columns} width={1600} />
    </ExampleLayout>
  );
};

const locales = ["en-GB", "en-US", "de-DE", "fr-FR", "ja-JP"];

export const Locales = () => {
  const columns = useMemo<ExampleColumn[]>(
    () => [
      { name: "id", serverDataType: "string", width: 60 },
      ...locales.map<ExampleColumn>((locale, i) => ({
        name: `tradeTimeLocale${i}`,
        sourceColumn: "tradeTime",
        label: locale,
        type: {
          name: "date/time",
          formatting: {
            locale,
            pattern: { date: "dd MMMM yyyy", time: "hh:mm:ss a" },
          },
        },
        width: 260,
      })),
    ],
    [],
  );
  return (
    <ExampleLayout
      title="Locales"
      notes={
        <>
          Pattern <code>dd MMMM yyyy hh:mm:ss a</code> rendered with different
          locales. The pattern determines the style of each field, the locale
          determines field order, language and separators.
        </>
      }
    >
      <DateTimeTable columns={columns} width={1400} />
    </ExampleLayout>
  );
};

const fractionDigits: FractionalSecondDigits[] = [0, 3, 6, 9];

export const FractionalSeconds = () => {
  const columns = useMemo<ExampleColumn[]>(
    () => [
      { name: "id", serverDataType: "string", width: 60 },
      { name: "execTime", label: "nanos, default", width: 260 },
      ...fractionDigits.map<ExampleColumn>((fractionalSecondDigits) => ({
        name: `execTime_${fractionalSecondDigits}`,
        sourceColumn: "execTime",
        label: `nanos, ${fractionalSecondDigits} digits`,
        type: {
          name: "time",
          formatting: {
            fractionalSecondDigits,
            pattern: { time: "hh:mm:ss" },
          },
        },
        width: 170,
      })),
      { name: "tradeTime", label: "millis, default" },
      {
        name: "tradeTimeMs",
        sourceColumn: "tradeTime",
        label: "millis, hh:mm:ss.ms",
        type: {
          name: "time",
          formatting: { pattern: { time: "hh:mm:ss.ms" } },
        },
      },
      {
        name: "tradeTime_6",
        sourceColumn: "tradeTime",
        label: "millis, 6 digits",
        type: {
          name: "time",
          formatting: {
            fractionalSecondDigits: 6,
            pattern: { time: "hh:mm:ss" },
          },
        },
      },
    ],
    [],
  );
  return (
    <ExampleLayout
      title="Fractional seconds"
      notes={
        <>
          <code>fractionalSecondDigits</code> controls sub-second precision.
          Nano timestamps can show up to 9 digits without loss (values are never
          converted to a JavaScript number). Millisecond values padded to 6
          digits show trailing zeros.
        </>
      }
    >
      <DateTimeTable columns={columns} width={1600} />
    </ExampleLayout>
  );
};

/**
 * The application default time zone applies to all temporal columns that
 * do not specify their own time zone.
 */
export const ApplicationDefaultTimeZone = () => {
  const [timeZone, setTimeZone] = useState(getDefaultTimeZone());
  useEffect(() => {
    const initialTimeZone = getDefaultTimeZone();
    return () => setDefaultTimeZone(initialTimeZone);
  }, []);

  const columns = useMemo<ExampleColumn[]>(
    () => [
      { name: "id", serverDataType: "string", width: 60 },
      { name: "tradeTime", label: `tradeTime (${timeZone})` },
      { name: "execTime", label: `execTime (${timeZone})`, width: 260 },
      {
        name: "tradeTimeTime",
        sourceColumn: "tradeTime",
        label: `time (${timeZone})`,
        type: "time",
      },
      {
        name: "tradeTimeTokyo",
        sourceColumn: "tradeTime",
        label: "time (fixed Asia/Tokyo)",
        type: { name: "time", formatting: { timeZone: "Asia/Tokyo" } },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [timeZone],
  );

  const selectTimeZone = (tz: string) => {
    setDefaultTimeZone(tz);
    setTimeZone(tz);
  };

  return (
    <ExampleLayout
      title="Application default time zone"
      notes={
        <>
          <code>setDefaultTimeZone</code> sets the time zone used by all
          temporal columns that do not specify one, for rendering, editing and
          filtering.
        </>
      }
    >
      <div style={{ display: "flex", gap: 8 }}>
        {timeZones.map((tz) => (
          <Button
            key={tz}
            onClick={() => selectTimeZone(tz)}
            sentiment={tz === timeZone ? "accented" : "neutral"}
          >
            {tz}
          </Button>
        ))}
      </div>
      <DateTimeTable columns={columns} key={timeZone} width={1000} />
    </ExampleLayout>
  );
};

type ServerDataType = "epochtimestamp" | "epochtimestampnano" | "long";
type TypeName = "(none)" | "date/time" | "date" | "time" | "number";
const DEFAULT = "(default)";

const sampleValues: Record<ServerDataType, string> = {
  epochtimestamp: "1710513045123",
  epochtimestampnano: "1710513045123456789",
  long: "1710513045123",
};

const SelectField = <T extends string>({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: T) => void;
  options: readonly T[];
  value: T;
}) => (
  <FormField>
    <FormFieldLabel>{label}</FormFieldLabel>
    <Dropdown<T>
      onSelectionChange={(_: SyntheticEvent, [v]: T[]) => onChange(v)}
      selected={[value]}
    >
      {options.map((o) => (
        <Option key={o} value={o}>
          {o}
        </Option>
      ))}
    </Dropdown>
  </FormField>
);

/**
 * Explore every combination of serverDataType, type and formatting options
 * on a single cell.
 */
export const TemporalCellPlayground = () => {
  const [serverDataType, setServerDataType] =
    useState<ServerDataType>("epochtimestampnano");
  const [typeName, setTypeName] = useState<TypeName>("(none)");
  const [datePattern, setDatePattern] = useState<string>(DEFAULT);
  const [timePattern, setTimePattern] = useState<string>(DEFAULT);
  const [timeZone, setTimeZone] = useState<string>(DEFAULT);
  const [locale, setLocale] = useState<string>(DEFAULT);
  const [digits, setDigits] = useState<string>(DEFAULT);
  const [value, setValue] = useState(sampleValues.epochtimestampnano);

  const handleServerDataTypeChange = (sdt: ServerDataType) => {
    setServerDataType(sdt);
    setValue(sampleValues[sdt]);
  };

  const column = useMemo<ColumnDescriptor>(() => {
    const formatting: ColumnTypeFormatting = {};
    if (datePattern !== DEFAULT || timePattern !== DEFAULT) {
      formatting.pattern = {
        date:
          datePattern !== DEFAULT ? (datePattern as DatePattern) : undefined,
        time:
          timePattern !== DEFAULT ? (timePattern as TimePattern) : undefined,
      } as ColumnTypeFormatting["pattern"];
    }
    if (timeZone !== DEFAULT) formatting.timeZone = timeZone;
    if (locale !== DEFAULT) formatting.locale = locale;
    if (digits !== DEFAULT) {
      formatting.fractionalSecondDigits = parseInt(
        digits,
        10,
      ) as FractionalSecondDigits;
    }
    const name: DataValueTypeSimple | undefined =
      typeName === "(none)" ? undefined : typeName;
    const hasFormatting = Object.keys(formatting).length > 0;
    return {
      name: "value",
      serverDataType,
      type:
        name === undefined && !hasFormatting
          ? undefined
          : { name: name ?? "date/time", formatting },
      width: 320,
    };
  }, [
    datePattern,
    digits,
    locale,
    serverDataType,
    timePattern,
    timeZone,
    typeName,
  ]);

  const [DataRow] = useMemo(
    () => dataRowFactory(["value"], [{ name: "value", serverDataType }]),
    [serverDataType],
  );

  const runtimeColumn = useMemo(
    () =>
      ({
        ...column,
        CellRenderer: getCellRenderer(column),
        valueFormatter: getValueFormatter(column),
      }) as unknown as RuntimeColumnDescriptor,
    [column],
  );

  const wireValue =
    serverDataType === "epochtimestampnano" ? value : Number(value);
  // prettier-ignore
  const dataRow = DataRow([
    0,
    0,
    true,
    false,
    1,
    0,
    "key",
    0,
    0,
    false,
    wireValue,
  ]);
  const temporalInfo = getTemporalInfo(column);
  const timestamp = temporalInfo
    ? EpochTimestamp.fromWire(wireValue, temporalInfo.encoding)
    : undefined;

  return (
    <ExampleLayout
      title="Temporal cell playground"
      notes="Enter a raw (wire) value and change the column configuration."
    >
      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(4, 200px)",
        }}
      >
        <SelectField<ServerDataType>
          label="serverDataType"
          onChange={handleServerDataTypeChange}
          options={["epochtimestamp", "epochtimestampnano", "long"]}
          value={serverDataType}
        />
        <SelectField<TypeName>
          label="type"
          onChange={setTypeName}
          options={["(none)", "date/time", "date", "time", "number"]}
          value={typeName}
        />
        <SelectField
          label="date pattern"
          onChange={setDatePattern}
          options={[DEFAULT, ...datePatterns]}
          value={datePattern}
        />
        <SelectField
          label="time pattern"
          onChange={setTimePattern}
          options={[DEFAULT, ...timePatterns]}
          value={timePattern}
        />
        <SelectField
          label="timeZone"
          onChange={setTimeZone}
          options={[DEFAULT, ...timeZones]}
          value={timeZone}
        />
        <SelectField
          label="locale"
          onChange={setLocale}
          options={[DEFAULT, ...locales]}
          value={locale}
        />
        <SelectField
          label="fractionalSecondDigits"
          onChange={setDigits}
          options={[DEFAULT, "0", "3", "6", "9"]}
          value={digits}
        />
        <FormField>
          <FormFieldLabel>raw value</FormFieldLabel>
          <Input
            inputProps={{
              onChange: (e: ChangeEvent<HTMLInputElement>) =>
                setValue(e.target.value),
            }}
            value={value}
          />
        </FormField>
      </div>
      <div
        style={{
          border: "solid 1px var(--salt-separable-primary-borderColor)",
          height: 24,
          width: 320,
        }}
      >
        <TableCell column={runtimeColumn} dataRow={dataRow} />
      </div>
      <div style={{ fontFamily: "monospace", fontSize: 12 }}>
        <div>column: {JSON.stringify(column)}</div>
        <div>temporalInfo: {JSON.stringify(temporalInfo)}</div>
        <div>
          canonical edit value:{" "}
          {temporalInfo ? formatTemporalInput(timestamp, temporalInfo) : "n/a"}
        </div>
        <div>ISO (UTC): {timestamp?.toString() ?? "n/a"}</div>
      </div>
    </ExampleLayout>
  );
};

const availableRenderers: CellRendererDescriptor[] = [
  { name: "Default renderer" },
];

const FormattingPanelTemplate = ({
  column: columnProp,
}: {
  column: ColumnDescriptor;
}) => {
  const [column, setColumn] = useState<ColumnDescriptor>(columnProp);
  const onChangeFormatting = useCallback((formatting: ColumnTypeFormatting) => {
    setColumn((col) => updateColumnFormatting(col, formatting));
  }, []);
  const onChangeType = useCallback((t: DataValueTypeSimple) => {
    setColumn((col) => updateColumnType(col, t));
  }, []);
  const columns = useMemo<ExampleColumn[]>(
    () => [
      { name: "id", serverDataType: "string", width: 60 },
      {
        ...column,
        name: "preview",
        sourceColumn: column.name as ExampleColumn["sourceColumn"],
        width: 320,
      },
    ],
    [column],
  );

  return (
    <div style={{ display: "flex", gap: 24 }}>
      <ColumnFormattingPanel
        availableRenderers={availableRenderers}
        column={column}
        onChangeColumnType={onChangeType}
        onChangeFormatting={onChangeFormatting}
        onChangeRendering={() => undefined}
        style={{
          border: "solid 1px lightgray",
          padding: 12,
          width: 300,
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <DateTimeTable columns={columns} height={300} width={400} />
        <div style={{ fontFamily: "monospace", fontSize: 12, width: 400 }}>
          {JSON.stringify(column.type)}
        </div>
      </div>
    </div>
  );
};

export const FormattingSettingsEpochTimestamp = () => (
  <ExampleLayout
    title="Formatting settings, epochtimestamp"
    notes="Changes made in the settings panel are applied to the preview table."
  >
    <FormattingPanelTemplate
      column={{ name: "tradeTime", serverDataType: "epochtimestamp" }}
    />
  </ExampleLayout>
);

export const FormattingSettingsEpochTimestampNano = () => (
  <ExampleLayout
    title="Formatting settings, epochtimestampnano"
    notes="6 and 9 fractional second digits are only offered for nano timestamps."
  >
    <FormattingPanelTemplate
      column={{ name: "execTime", serverDataType: "epochtimestampnano" }}
    />
  </ExampleLayout>
);

export const FormattingSettingsLegacyLong = () => (
  <ExampleLayout
    title="Formatting settings, legacy long"
    notes="A long column can be switched between number and the temporal types."
  >
    <FormattingPanelTemplate
      column={{
        name: "legacyCreated",
        serverDataType: "long",
        type: "date/time",
      }}
    />
  </ExampleLayout>
);
