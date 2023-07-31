import { GridConfig } from "@finos/vuu-datagrid-types";
import {
  FormField,
  FormFieldLabel,
  Panel,
  RadioButton,
  RadioButtonGroup,
  Text,
} from "@salt-ds/core";
import { StepperInput } from "@salt-ds/lab";
import { ChangeEvent, Dispatch, HTMLAttributes, useCallback } from "react";

import "./GridSettingsPanel.css";
import { ColumnAction } from "./useGridSettings";

const classBase = "vuuGridSettingsPanel";

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
        <FormField labelPlacement="left">
          <FormFieldLabel>Format column labels</FormFieldLabel>
          <RadioButtonGroup
            aria-label="Format column labels"
            value={config.columnFormatHeader}
            onChange={handleChangeLabelFormatting}
          >
            <RadioButton label="No Formatting" value={undefined} />
            <RadioButton label="Capitalize" value="capitalize" />
            <RadioButton label="Uppercase" value="uppercase" />
          </RadioButtonGroup>
        </FormField>
        <FormField labelPlacement="left">
          <FormFieldLabel>Default Column Width</FormFieldLabel>
          <StepperInput
            value={config.columnDefaultWidth ?? 100}
            onChange={handleChangeWidth}
          />
        </FormField>
      </Panel>
    </div>
  );
};
