import { ColumnType } from "@finos/vuu-datagrid-types";
import { StepperInput, Switch } from "@salt-ds/lab";
import { FormField, Text } from "@salt-ds/core";
import { useCallback } from "react";
import { ColumnTypePanelProps } from "./ColumnTypePanel";

import "./ColumnTypePanel.css";

type NumericColumnConfig = {
  alignOnDecimals: boolean;
  decimals: number;
  zeroPad: boolean;
};

const defaultValues = {
  alignOnDecimals: false,
  decimals: 4,
  zeroPad: false,
} as NumericColumnConfig;

const getColumnValues = (
  columnType?: ColumnType,
  gridDefaultValues?: Partial<NumericColumnConfig>
) => {
  const columnValue =
    typeof columnType === "object" && columnType.formatting
      ? columnType.formatting
      : {};

  const properties = ["alignOnDecimals", "decimals", "zeroPad"] as Array<
    keyof NumericColumnConfig
  >;
  return properties.reduce<NumericColumnConfig>((configValues, property) => {
    if (columnValue[property] !== undefined) {
      return {
        ...configValues,
        [property]: columnValue[property],
      };
    } else if (gridDefaultValues?.[property] !== undefined) {
      return {
        ...configValues,
        [property]: gridDefaultValues[property],
      };
    }
    return configValues;
  }, defaultValues);
};

export const NumericColumnPanel = ({
  column,
  dispatchColumnAction,
}: ColumnTypePanelProps) => {
  const { decimals, alignOnDecimals, zeroPad } = getColumnValues(column?.type);

  const dispatchUpdate = useCallback(
    (values: Partial<NumericColumnConfig>) =>
      dispatchColumnAction({
        type: "updateColumnTypeFormatting",
        column,
        ...values,
      }),
    [column, dispatchColumnAction]
  );

  const handleChangeDecimals = useCallback(
    (value: string | number) =>
      dispatchUpdate({ decimals: parseInt(value.toString(), 10) }),
    [dispatchUpdate]
  );
  const handleChangeAlignOnDecimals = useCallback(
    (evt, value) => dispatchUpdate({ alignOnDecimals: value }),
    [dispatchUpdate]
  );
  const handleChangeZeroPad = useCallback(
    (evt, value) => dispatchUpdate({ zeroPad: value }),
    [dispatchUpdate]
  );

  switch (column.serverDataType) {
    case "double":
      return (
        <>
          <FormField label="No of Decimals" labelPlacement="top">
            <StepperInput value={decimals} onChange={handleChangeDecimals} />
          </FormField>
          <Switch
            checked={alignOnDecimals}
            label="Align on decimals"
            LabelProps={{ className: "vuuColumnPanelSwitch" }}
            onChange={handleChangeAlignOnDecimals}
          />
          <Switch
            checked={zeroPad}
            label="Zero pad"
            LabelProps={{ className: "vuuColumnPanelSwitch" }}
            onChange={handleChangeZeroPad}
          />
        </>
      );
    case "long":
    case "int":
      return (
        <>
          <Text>Work in progress</Text>
        </>
      );
    default:
      return null;
  }
};
