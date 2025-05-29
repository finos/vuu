import {
  ColumnDescriptor,
  ListOption,
  LookupTableDetails,
} from "@vuu-ui/vuu-table-types";
import { VuuDataSource } from "@vuu-ui/vuu-data-remote";
import {
  buildColumnMap,
  getSelectedOption,
  isLookupRenderer,
  isTypeDescriptor,
  isValueListRenderer,
  useShellContext,
} from "@vuu-ui/vuu-utils";
import { useMemo, useState } from "react";

const NO_VALUES: ListOption[] = [];

const toListOption = (value: string): ListOption => ({
  label: value,
  value,
});

const lookupValueMap = new Map<string, Promise<ListOption[]>>();

const loadLookupValues = ({
  labelColumn,
  table,
  valueColumn,
}: LookupTableDetails): Promise<ListOption[]> => {
  const tableKey = `${table.module}:${table.table}`;
  const lookupValues = lookupValueMap.get(tableKey);
  if (lookupValues) {
    return lookupValues;
  } else {
    const promise: Promise<ListOption[]> = new Promise((resolve) => {
      const columns = [valueColumn, labelColumn];
      const columnMap = buildColumnMap(columns);
      const dataSource = new VuuDataSource({
        bufferSize: 0,
        table,
      });
      dataSource.subscribe(
        {
          columns,
          range: { from: 0, to: 100 },
        },
        (message) => {
          if (message.type === "viewport-update") {
            //TODO check we have full dataset
            if (message.rows) {
              const listOptions = message.rows.map<ListOption>((row) => ({
                value: row[columnMap[valueColumn]] as string | number,
                label: row[columnMap[labelColumn]] as string,
              }));
              resolve(listOptions);
              dataSource.unsubscribe();
            }
          }
        },
      );
    });
    lookupValueMap.set(tableKey, promise);
    return promise;
  }
};

type LookupState = {
  initialValue: ListOption | null;
  values: ListOption[];
};

const getLookupDetails = ({ name, type }: ColumnDescriptor) => {
  if (isTypeDescriptor(type) && isLookupRenderer(type.renderer)) {
    return type.renderer.lookup;
  } else {
    throw Error(
      `useLookupValues column ${name} is not configured to use lookup values`,
    );
  }
};

export const useLookupValues = (
  column: ColumnDescriptor,
  initialValueProp: number | string,
) => {
  const { type: columnType } = column;
  const { getLookupValues } = useShellContext();

  const initialState = useMemo<LookupState>(() => {
    if (
      isTypeDescriptor(columnType) &&
      isValueListRenderer(columnType?.renderer)
    ) {
      const values = columnType.renderer.values.map(toListOption);
      return {
        initialValue: getSelectedOption(values, initialValueProp) ?? null,
        values,
      };
    } else {
      const lookupDetails = getLookupDetails(column);
      const values = getLookupValues?.(lookupDetails.table) ?? NO_VALUES;

      return {
        initialValue: getSelectedOption(values, initialValueProp) ?? null,
        values,
      };
    }
  }, [column, columnType, getLookupValues, initialValueProp]);

  const [{ initialValue, values }, setLookupState] =
    useState<LookupState>(initialState);

  useMemo(() => {
    if (values === NO_VALUES) {
      const lookupDetails = getLookupDetails(column);
      loadLookupValues(lookupDetails).then((values) =>
        setLookupState({
          initialValue: getSelectedOption(values, initialValueProp) ?? null,
          values,
        }),
      );
    }
  }, [values, column, initialValueProp]);

  return {
    initialValue,
    values,
  };
};
