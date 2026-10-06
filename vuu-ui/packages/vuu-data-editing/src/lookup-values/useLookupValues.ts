import type {
  DataSourceRow,
  DataSourceSubscribeCallback,
} from "@vuu-ui/vuu-data-types";
import type { VuuTable } from "@vuu-ui/vuu-protocol-types";
import { Range, useData } from "@vuu-ui/vuu-utils";
import { useEffect, useMemo, useState } from "react";

export type LookupOption = {
  label: string;
  metadata?: Record<string, string>;
  value: number | string;
};

export type OptionMap = {
  additionalFields?: readonly string[];
  label: string;
  value: string;
};

export interface LookupValuedHookProps {
  enabled: boolean;
  optionMap?: OptionMap;
  table?: VuuTable;
}

const DATA_ROW_COLUMN_OFFSET = 10;

export const lookupOptionsFromRows = (
  columns: string[],
  rows: DataSourceRow[],
  optionMap: OptionMap,
): LookupOption[] => {
  const requestedColumns = [
    optionMap.value,
    optionMap.label,
    ...(optionMap.additionalFields ?? []),
  ];
  const missingColumns = requestedColumns.filter(
    (column) => !columns.includes(column),
  );

  if (missingColumns.length > 0) {
    throw Error(
      `[useLookupValues] lookup columns not found: ${requestedColumns.join(", ")}`,
    );
  }

  return rows.map((row) => {
    const metadata = Object.fromEntries(
      (optionMap.additionalFields ?? []).map((field) => [
        field,
        String(row[columns.indexOf(field) + DATA_ROW_COLUMN_OFFSET]),
      ]),
    );
    return {
      value: String(
        row[columns.indexOf(optionMap.value) + DATA_ROW_COLUMN_OFFSET],
      ),
      label: String(
        row[columns.indexOf(optionMap.label) + DATA_ROW_COLUMN_OFFSET],
      ),
      ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
    };
  });
};

export const useLookupValues = ({
  enabled,
  optionMap,
  table,
}: LookupValuedHookProps) => {
  if (enabled && (optionMap === undefined || table === undefined)) {
    throw Error("[useLookupValues] optionsMap and Table must be provided");
  }

  const { VuuDataSource } = useData();
  const [options, setOptions] = useState<LookupOption[]>([]);
  const lookupColumns = useMemo(
    () =>
      optionMap
        ? [
            optionMap.value,
            optionMap.label,
            ...(optionMap.additionalFields ?? []),
          ]
        : [],
    [optionMap],
  );
  const dataSource = useMemo(
    () =>
      enabled && optionMap && table
        ? new VuuDataSource({
            columns: lookupColumns,
            table,
          })
        : undefined,
    [VuuDataSource, enabled, lookupColumns, optionMap, table],
  );

  useEffect(() => {
    setOptions([]);
    if (!dataSource || !optionMap) return;

    let active = true;
    let columns: string[] | undefined;
    const subscribe: DataSourceSubscribeCallback = (message) => {
      if (!active) return;
      if (message.type === "subscribed") {
        const schemaColumns = new Set(
          message.tableSchema.columns.map(({ name }) => name),
        );
        if (
          !lookupColumns.every(
            (column) =>
              message.columns.includes(column) && schemaColumns.has(column),
          )
        ) {
          throw Error(
            `[useLookupValues] lookup columns not found: ${lookupColumns.join(", ")}`,
          );
        }
        columns = message.columns;
      } else if (message.type === "viewport-update" && columns) {
        setOptions(
          lookupOptionsFromRows(columns, message.rows ?? [], optionMap),
        );
      } else if (message.type === "subscribe-failed") {
        console.error(
          `Lookup table ${table?.table} subscription failed: ${message.msg}`,
        );
      }
    };

    void dataSource
      .subscribe({ range: Range(0, 100) }, subscribe)
      .catch((cause) => {
        if (active) {
          console.error("Role client dropdown subscription failed:", cause);
        }
      });

    return () => {
      active = false;
      dataSource.unsubscribe();
    };
  }, [dataSource, lookupColumns, optionMap, table]);

  return options;
};
