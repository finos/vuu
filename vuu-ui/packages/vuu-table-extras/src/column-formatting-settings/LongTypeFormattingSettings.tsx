import {
  FormField,
  FormFieldLabel,
  ToggleButton,
  ToggleButtonGroup,
} from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { FormattingSettingsProps } from "@vuu-ui/vuu-table-types";
import React, { useCallback } from "react";
import { BaseNumericFormattingSettings } from "./BaseNumericFormattingSettings";

import longTypeFormattingSettingsCss from "./LongTypeFormattingSettings.css";
import { isTypeDescriptor } from "@vuu-ui/vuu-utils";

const classBase = "vuuLongColumnFormattingSettings";

export const LongTypeFormattingSettings = (props: FormattingSettingsProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-long-formatting-settings",
    css: longTypeFormattingSettingsCss,
    window: targetWindow,
  });

  const { column, onChangeColumnType: onChangeType } = props;
  const type = isTypeDescriptor(column.type) ? column.type.name : column.type;

  const handleToggleChange = useCallback(
    (event: React.SyntheticEvent<HTMLButtonElement, Event>) => {
      const value = event.currentTarget.value as ToggleValue;
      onChangeType(value);
    },
    [onChangeType],
  );

  return (
    <div className={classBase}>
      <FormField>
        <FormFieldLabel>{"Type inferred as"}</FormFieldLabel>
        <ToggleButtonGroup
          className="vuuToggleButtonGroup"
          onChange={handleToggleChange}
          value={type ?? "number"}
        >
          {toggleValues.map((v) => (
            <ToggleButton key={v} value={v}>
              {v.toUpperCase()}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </FormField>
      <BaseNumericFormattingSettings {...props} />
    </div>
  );
};

const toggleValues = ["number", "date/time"] as const;
type ToggleValue = (typeof toggleValues)[number];
