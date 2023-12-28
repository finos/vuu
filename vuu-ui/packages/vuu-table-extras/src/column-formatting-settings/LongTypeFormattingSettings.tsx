import React, { useCallback } from "react";
import {
  FormField,
  FormFieldLabel,
  ToggleButton,
  ToggleButtonGroup,
} from "@salt-ds/core";
import { isDateTimeColumn, isTypeDescriptor } from "@finos/vuu-utils";
import { DateTimeFormattingSettings } from "./DateTimeFormattingSettings";
import { BaseNumericFormattingSettings } from "./BaseNumericFormattingSettings";
import { FormattingSettingsProps } from "./types";

import "./LongTypeFormattingSettings.css";

const classBase = "vuuLongColumnFormattingSettings";

export const LongTypeFormattingSettings: React.FC<FormattingSettingsProps> = (
  props
) => {
  const { column, onChangeType } = props;
  const type = isTypeDescriptor(column.type) ? column.type.name : column.type;

  const handleToggleChange = useCallback(
    (event: React.SyntheticEvent<HTMLButtonElement, Event>) => {
      const value = event.currentTarget.value as ToggleValue;
      onChangeType(value);
    },
    [onChangeType]
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

      {isDateTimeColumn(column) ? (
        <DateTimeFormattingSettings {...props} column={column} />
      ) : (
        <BaseNumericFormattingSettings {...props} />
      )}
    </div>
  );
};

const toggleValues = ["number", "date/time"] as const;
type ToggleValue = (typeof toggleValues)[number];
