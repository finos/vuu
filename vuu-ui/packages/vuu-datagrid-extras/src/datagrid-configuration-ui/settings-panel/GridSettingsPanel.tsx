import { GridConfig } from "@finos/vuu-datagrid-types";
import {
  FormField,
  Panel,
  RadioButton,
  RadioButtonGroup,
  StepperInput,
} from "@heswell/salt-lab";
import { Text } from "@salt-ds/core";
import { ChangeEvent, Dispatch, HTMLAttributes, useCallback } from "react";

import "./GridSettingsPanel.css";
import { ColumnAction } from "./useGridSettings";

const classBase = "vuuGridSettingsPanel";

const NullActivationIndicator = () => null;

export interface GridSettingsPanelProps extends HTMLAttributes<HTMLDivElement> {
  config: Omit<GridConfig, "headings">;
  dispatchColumnAction: Dispatch<ColumnAction>;
}
export const GridSettingsPanel = ({
  config,
  dispatchColumnAction,
  style: styleProp,
  ...props
}: GridSettingsPanelProps) => {
  const dispatchUpdate = useCallback(
    (
      values: Partial<
        Pick<GridConfig, "columnDefaultWidth" | "columnFormatHeader">
      >
    ) =>
      dispatchColumnAction({
        type: "updateGridSettings",
        ...values,
      }),
    [dispatchColumnAction]
  );

  const handleChangeLabelFormatting = useCallback(
    (evt: ChangeEvent<HTMLInputElement>) =>
      dispatchUpdate({
        columnFormatHeader: evt.target.value as "capitalize" | "uppercase",
      }),
    [dispatchUpdate]
  );

  const handleChangeWidth = useCallback(
    (value: string | number) =>
      dispatchUpdate({ columnDefaultWidth: parseInt(value.toString(), 10) }),
    [dispatchUpdate]
  );

  console.log(`GridSettingsPanel ${JSON.stringify(config.columns, null, 2)}`);

  return (
    <div
      className={classBase}
      {...props}
      style={{
        ...styleProp,
      }}
    >
      <Text as="h4">Grid Settings</Text>
      <Panel>
        <FormField
          label="Format column labels"
          labelPlacement="left"
          ActivationIndicatorComponent={NullActivationIndicator}
        >
          <RadioButtonGroup
            aria-label="Format column labels"
            value={config.columnFormatHeader}
            legend="Format column labels"
            onChange={handleChangeLabelFormatting}
          >
            <RadioButton label="No Formatting" value={undefined} />
            <RadioButton label="Capitalize" value="capitalize" />
            <RadioButton label="Uppercase" value="uppercase" />
          </RadioButtonGroup>
        </FormField>
        <FormField label="Default Column Width" labelPlacement="left">
          <StepperInput
            value={config.columnDefaultWidth ?? 100}
            onChange={handleChangeWidth}
          />
        </FormField>
      </Panel>
    </div>
  );
};
