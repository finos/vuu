import {
  ColumnDescriptor,
  ListOption,
  LookupTableDetails,
} from "@finos/vuu-datagrid-types";
import { RemoteDataSource } from "@finos/vuu-data";
import { useShellContext } from "@finos/vuu-shell";
import {
  buildColumnMap,
  isLookupRenderer,
  isTypeDescriptor,
} from "@finos/vuu-utils";
import { useMemo, useState } from "react";

const NO_VALUES: ListOption[] = [];

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
      const dataSource = new RemoteDataSource({
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
        }
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

const getSelectedOption = (
  values: ListOption[],
  selectedValue: string | number | undefined
) => {
  if (selectedValue === undefined) {
    return null;
  }
  return values.find((option) => option.value === selectedValue) ?? null;
};

const getLookupDetails = ({ name, type }: ColumnDescriptor) => {
  if (isTypeDescriptor(type) && isLookupRenderer(type.renderer)) {
    return type.renderer.lookup;
  } else {
    throw Error(
      `useLookupValues column ${name} is not configured to use lookup values`
    );
  }
};

export const useLookupValues = (
  column: ColumnDescriptor,
  initialValueProp: number | string
) => {
  const lookupDetails = getLookupDetails(column);
  const { getLookupValues } = useShellContext();

  const initialState = useMemo<LookupState>(() => {
    const values = getLookupValues?.(lookupDetails.table) ?? NO_VALUES;
    return {
      initialValue: getSelectedOption(values, initialValueProp),
      values,
    };
  }, [getLookupValues, initialValueProp, lookupDetails.table]);

  const [{ initialValue, values }, setLookupState] =
    useState<LookupState>(initialState);

  useMemo(() => {
    if (values === NO_VALUES) {
      loadLookupValues(lookupDetails).then((values) =>
        setLookupState({
          initialValue: getSelectedOption(values, initialValueProp),
          values,
        })
      );
    }
  }, [values, lookupDetails, initialValueProp]);

  return {
    initialValue,
    values,
  };
};
