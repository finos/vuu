import { useMemo } from "react";
import type { ExampleColumn } from "../../DateTime/date-time-data";
import { DateTimeTable } from "../../DateTime/date-time-templates";
import { FormattingSettingsEpochTimestampNano } from "../../DateTime/CellRendering.examples";

export const DateAndTimePatterns = () => {
  const columns = useMemo<ExampleColumn[]>(
    () => [
      { name: "id", serverDataType: "string", width: 50 },
      {
        name: "isoDate",
        sourceColumn: "tradeTime",
        label: "yyyy-mm-dd",
        type: { name: "date", formatting: { pattern: { date: "yyyy-mm-dd" } } },
        width: 110,
      },
      {
        name: "longDate",
        sourceColumn: "tradeTime",
        label: "dd MMMM yyyy",
        type: {
          name: "date",
          formatting: { pattern: { date: "dd MMMM yyyy" } },
        },
        width: 150,
      },
      {
        name: "time12",
        sourceColumn: "tradeTime",
        label: "hh:mm:ss a",
        type: { name: "time", formatting: { pattern: { time: "hh:mm:ss a" } } },
        width: 120,
      },
      {
        name: "dateTime",
        sourceColumn: "tradeTime",
        label: "MMM dd, yyyy hh:mm:ss",
        type: {
          name: "date/time",
          formatting: {
            pattern: { date: "MMM dd, yyyy", time: "hh:mm:ss" },
          },
        },
        width: 200,
      },
    ],
    [],
  );
  return <DateTimeTable columns={columns} height={220} width={650} />;
};

export const FractionalSeconds = () => {
  const columns = useMemo<ExampleColumn[]>(
    () => [
      { name: "id", serverDataType: "string", width: 50 },
      ...([0, 3, 6, 9] as const).map<ExampleColumn>((digits) => ({
        name: `execTime${digits}`,
        sourceColumn: "execTime",
        label: `${digits} digits`,
        type: {
          name: "time",
          formatting: { fractionalSecondDigits: digits },
        },
        width: 150,
      })),
    ],
    [],
  );
  return <DateTimeTable columns={columns} height={220} width={660} />;
};

export const TimeZones = () => {
  const columns = useMemo<ExampleColumn[]>(
    () => [
      { name: "id", serverDataType: "string", width: 50 },
      ...["local", "UTC", "America/New_York", "Asia/Tokyo"].map<ExampleColumn>(
        (timeZone) => ({
          name: `tradeTime_${timeZone.replace("/", "_")}`,
          sourceColumn: "tradeTime",
          label: timeZone,
          type: { name: "date/time", formatting: { timeZone } },
          width: 160,
        }),
      ),
    ],
    [],
  );
  return <DateTimeTable columns={columns} height={220} width={700} />;
};

export const Locales = () => {
  const columns = useMemo<ExampleColumn[]>(
    () => [
      { name: "id", serverDataType: "string", width: 50 },
      ...["en-GB", "en-US", "de-DE", "ja-JP"].map<ExampleColumn>((locale) => ({
        name: `tradeTime_${locale}`,
        sourceColumn: "tradeTime",
        label: locale,
        type: {
          name: "date/time",
          formatting: {
            locale,
            pattern: { date: "dd MMMM yyyy", time: "hh:mm:ss" },
          },
        },
        width: 220,
      })),
    ],
    [],
  );
  return <DateTimeTable columns={columns} height={220} width={940} />;
};

export const FormattingSettings = () => (
  <FormattingSettingsEpochTimestampNano />
);
