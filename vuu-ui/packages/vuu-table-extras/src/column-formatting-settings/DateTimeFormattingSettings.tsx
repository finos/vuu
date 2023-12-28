import React, { SyntheticEvent, useCallback, useMemo, useState } from "react";
import { Dropdown, SingleSelectionHandler } from "@finos/vuu-ui-controls";
import {
  DateTimePattern,
  defaultPatternsByType,
  fallbackDateTimePattern,
  getTypeFormattingFromColumn,
  supportedDateTimePatterns,
} from "@finos/vuu-utils";
import {
  FormField,
  FormFieldLabel,
  ToggleButton,
  ToggleButtonGroup,
} from "@salt-ds/core";
import { DateTimeColumnDescriptor } from "@finos/vuu-table-types";
import { FormattingSettingsProps } from "./types";

export const DateTimeFormattingSettings: React.FC<
  FormattingSettingsProps<DateTimeColumnDescriptor>
> = ({ column, onChangeFormatting: onChange }) => {
  const formatting = getTypeFormattingFromColumn(column);
  const { pattern = fallbackDateTimePattern } = formatting;
  const toggleValue = useMemo(() => getToggleValue(pattern), [pattern]);

  const [fallbackState, setFallbackState] = useState<Required<DateTimePattern>>(
    {
      time: pattern.time ?? defaultPatternsByType.time,
      date: pattern.date ?? defaultPatternsByType.date,
    }
  );

  const onPatternChange = useCallback(
    (pattern: DateTimePattern) => onChange({ ...formatting, pattern }),
    [onChange, formatting]
  );

  const onDropdownChange = useCallback<
    <T extends keyof DateTimePattern>(
      key: T
    ) => SingleSelectionHandler<Required<DateTimePattern>[T]>
  >(
    (key) => (_, p) => {
      const updatedPattern = { ...(pattern ?? {}), [key]: p };
      setFallbackState((s) => ({
        time: updatedPattern.time ?? s.time,
        date: updatedPattern.date ?? s.date,
      }));
      onPatternChange(updatedPattern);
    },
    [onPatternChange, pattern]
  );

  const onToggleChange = useCallback(
    (evnt: SyntheticEvent<HTMLButtonElement, Event>) => {
      const value = evnt.currentTarget.value as ToggleValue;
      switch (value) {
        case "time":
          return onPatternChange({
            [value]: pattern[value] ?? fallbackState[value],
          });
        case "date":
          return onPatternChange({
            [value]: pattern[value] ?? fallbackState[value],
          });
        case "both":
          return onPatternChange({
            time: pattern.time ?? fallbackState.time,
            date: pattern.date ?? fallbackState.date,
          });
      }
    },
    [onPatternChange, pattern, fallbackState]
  );

  return (
    <>
      <FormField labelPlacement="left">
        <FormFieldLabel>{"Display"}</FormFieldLabel>
        <ToggleButtonGroup
          className="vuuToggleButtonGroup"
          onChange={onToggleChange}
          value={toggleValue}
        >
          {toggleValues.map((v) => (
            <ToggleButton key={v} value={v}>
              {v.toUpperCase()}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </FormField>

      {(["date", "time"] as const)
        .filter((v) => !!pattern[v])
        .map((v) => (
          <FormField labelPlacement="left" key={v}>
            <FormFieldLabel>{`${labelByType[v]} pattern`}</FormFieldLabel>
            <Dropdown<Required<DateTimePattern>[typeof v]>
              onSelectionChange={onDropdownChange(v)}
              selected={pattern[v]}
              source={supportedDateTimePatterns[v]}
              width="100%"
            />
          </FormField>
        ))}
    </>
  );
};

const labelByType = { date: "Date", time: "Time" } as const;

const toggleValues = ["date", "time", "both"] as const;

type ToggleValue = (typeof toggleValues)[number];

function getToggleValue(pattern: DateTimePattern): ToggleValue {
  return !pattern.time ? "date" : !pattern.date ? "time" : "both";
}
