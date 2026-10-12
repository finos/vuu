import type { DataValueDescriptor } from "@vuu-ui/vuu-data-types";
import { getTemporalInfo } from "@vuu-ui/vuu-utils";
import { useMemo } from "react";
import type { ExampleColumn } from "../../DateTime/date-time-data";
import { DateTimeTable } from "../../DateTime/date-time-templates";

export const TemporalKinds = () => {
  const columns = useMemo<ExampleColumn[]>(
    () => [
      { name: "id", serverDataType: "string", width: 50 },
      { name: "tradeTime", label: "Trade time", width: 160 },
      {
        name: "tradeDate",
        sourceColumn: "tradeTime",
        label: "Trade date",
        type: "date",
        width: 100,
      },
      {
        name: "tradeTimeOfDay",
        sourceColumn: "tradeTime",
        label: "Time of day",
        type: "time",
        width: 100,
      },
      {
        name: "tradeTimeRaw",
        sourceColumn: "tradeTime",
        label: "Raw epoch",
        type: "number",
        width: 130,
      },
      { name: "execTime", label: "Execution time (ns)", width: 250 },
    ],
    [],
  );
  return <DateTimeTable columns={columns} height={260} width={800} />;
};

export const DeprecatedLongTimestamps = () => {
  const columns = useMemo<ExampleColumn[]>(
    () => [
      { name: "id", serverDataType: "string", width: 50 },
      {
        name: "legacyRaw",
        sourceColumn: "legacyCreated",
        label: "long, no type",
        serverDataType: "long",
        width: 150,
      },
      {
        name: "legacyCreated",
        label: "long, date/time",
        serverDataType: "long",
        type: "date/time",
        width: 170,
      },
    ],
    [],
  );
  return <DateTimeTable columns={columns} height={220} width={400} />;
};

type Descriptor = Pick<DataValueDescriptor, "serverDataType" | "type">;

const descriptors: Array<{ label: string; descriptor: Descriptor }> = [
  {
    label: `{ serverDataType: "epochtimestamp" }`,
    descriptor: { serverDataType: "epochtimestamp" },
  },
  {
    label: `{ serverDataType: "epochtimestamp", type: "date" }`,
    descriptor: { serverDataType: "epochtimestamp", type: "date" },
  },
  {
    label: `{ serverDataType: "epochtimestamp", type: "number" }`,
    descriptor: { serverDataType: "epochtimestamp", type: "number" },
  },
  {
    label: `{ serverDataType: "epochtimestampnano", type: "time" }`,
    descriptor: { serverDataType: "epochtimestampnano", type: "time" },
  },
  {
    label: `{ serverDataType: "epochtimestampnano", type: { name: "date/time", formatting: { timeZone: "UTC" } } }`,
    descriptor: {
      serverDataType: "epochtimestampnano",
      type: { name: "date/time", formatting: { timeZone: "UTC" } },
    },
  },
  {
    label: `{ serverDataType: "long", type: "date/time" } (deprecated)`,
    descriptor: { serverDataType: "long", type: "date/time" },
  },
  {
    label: `{ serverDataType: "long" }`,
    descriptor: { serverDataType: "long" },
  },
];

const cellStyle = { padding: "4px 8px", textAlign: "left" } as const;

export const ResolvedTemporalInfo = () => (
  <table style={{ borderCollapse: "collapse", fontSize: 12 }}>
    <thead>
      <tr>
        {["Descriptor", "kind", "encoding", "precision", "timeZone"].map(
          (heading) => (
            <th key={heading} style={cellStyle}>
              {heading}
            </th>
          ),
        )}
      </tr>
    </thead>
    <tbody>
      {descriptors.map(({ label, descriptor }) => {
        const info = getTemporalInfo(descriptor);
        return (
          <tr key={label}>
            <td style={{ ...cellStyle, fontFamily: "monospace" }}>{label}</td>
            {info ? (
              <>
                <td style={cellStyle}>{info.kind}</td>
                <td style={cellStyle}>{info.encoding}</td>
                <td style={cellStyle}>{info.precision}</td>
                <td style={cellStyle}>{info.timeZone}</td>
              </>
            ) : (
              <td colSpan={4} style={cellStyle}>
                not temporal
              </td>
            )}
          </tr>
        );
      })}
    </tbody>
  </table>
);
