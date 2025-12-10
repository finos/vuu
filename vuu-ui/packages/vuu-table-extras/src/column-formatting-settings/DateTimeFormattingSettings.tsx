import { FormattingSettingsProps } from "@vuu-ui/vuu-table-types";
import {
  DatePattern,
  DateTimePattern,
  TimePattern,
  dateTimeLabelByType,
  defaultPatternsByType,
  fallbackDateTimePattern,
  getTypeFormattingFromColumn,
  isDatePattern,
  isTimePattern,
  supportedDateTimePatterns,
} from "@vuu-ui/vuu-utils";
import {
  Dropdown,
  FormField,
  FormFieldLabel,
  Option,
  ToggleButton,
  ToggleButtonGroup,
} from "@salt-ds/core";
import React, { SyntheticEvent, useCallback, useMemo, useState } from "react";

const toggleValues = ["date", "time", "both"] as const;
type ToggleValue = (typeof toggleValues)[number];

function getToggleValue(pattern: DateTimePattern): ToggleValue {
  return !pattern.time ? "date" : !pattern.date ? "time" : "both";
}

type DateTime = keyof DateTimePattern;

const getSelectedPattern = (
  pattern?: DatePattern | TimePattern,
): DatePattern[] | TimePattern[] | undefined => {
  if (isDatePattern(pattern)) {
    return [pattern] as DatePattern[];
  } else if (isTimePattern(pattern)) {
    return [pattern] as TimePattern[];
  } else {
    return undefined;
  }
};

export const DateTimeFormattingSettings: React.FC<FormattingSettingsProps> = ({
  column,
  onChangeFormatting: onChange,
}) => {
  const formatting = getTypeFormattingFromColumn(column);
  const { pattern = fallbackDateTimePattern } = formatting;
  const toggleValue = useMemo(() => getToggleValue(pattern), [pattern]);

  const [fallbackState, setFallbackState] = useState<Required<DateTimePattern>>(
    {
      time: pattern.time ?? defaultPatternsByType.time,
      date: pattern.date ?? defaultPatternsByType.date,
    },
  );

  const onPatternChange = useCallback(
    (pattern: DateTimePattern) => onChange({ ...formatting, pattern }),
    [onChange, formatting],
  );

  const onDropdownChange = useCallback<
    <T extends DateTime>(
      dateTime: T,
    ) => (
      e: SyntheticEvent,
      newSelected: Array<Required<DateTimePattern>[T]>,
    ) => void
  >(
    (dateTime) =>
      (_, [selectedPattern]) => {
        const updatedPattern = {
          ...(pattern ?? {}),
          [dateTime]: selectedPattern,
        };
        setFallbackState((s) => ({
          time: updatedPattern.time ?? s.time,
          date: updatedPattern.date ?? s.date,
        }));
        onPatternChange(updatedPattern);
      },
    [onPatternChange, pattern],
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
    [onPatternChange, pattern, fallbackState],
  );

  return (
    <>
      <FormField labelPlacement="top">
        <FormFieldLabel>{"Display"}</FormFieldLabel>
        <ToggleButtonGroup
          className="vuuToggleButtonGroup"
          onChange={onToggleChange}
          value={toggleValue}
          data-variant="primary"
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
          <FormField labelPlacement="top" key={v}>
            <FormFieldLabel>{`${dateTimeLabelByType[v]} pattern`}</FormFieldLabel>
            <Dropdown<Required<DateTimePattern>[typeof v]>
              onSelectionChange={onDropdownChange(v)}
              selected={getSelectedPattern(pattern[v])}
            >
              {supportedDateTimePatterns[v].map((pattern, i) => (
                <Option key={i} value={pattern}>
                  {pattern}
                </Option>
              ))}
            </Dropdown>
          </FormField>
        ))}
    </>
  );
};
