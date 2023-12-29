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
  Switch,
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

  const onPatternChange = useCallback(
    (pattern: DateTimePattern) => onChange({ ...formatting, pattern }),
    [onChange, formatting]
  );

  const { onDropdownChange, onSwitchChange, onToggleChange } =
    useDateTimeFormattingSettings({ pattern, onPatternChange });

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

      <FormField labelPlacement="left">
        <FormFieldLabel>{"Show time-zone"}</FormFieldLabel>
        <Switch checked={!!pattern.showTimeZone} onChange={onSwitchChange} />
      </FormField>
    </>
  );
};

const labelByType = { date: "Date", time: "Time" } as const;

const toggleValues = ["date", "time", "both"] as const;

type ToggleValue = (typeof toggleValues)[number];

function getToggleValue(pattern: DateTimePattern): ToggleValue {
  return !pattern.time ? "date" : !pattern.date ? "time" : "both";
}

type RequiredDateTimePattern = Required<Pick<DateTimePattern, "date" | "time">>;

function useDateTimeFormattingSettings(props: {
  pattern: DateTimePattern;
  onPatternChange: (p: DateTimePattern) => void;
}) {
  const { pattern, onPatternChange } = props;
  const [fallbackState, setFallbackState] = useState<RequiredDateTimePattern>({
    time: pattern.time ?? defaultPatternsByType.time,
    date: pattern.date ?? defaultPatternsByType.date,
  });

  const onDropdownChange = useCallback<
    <T extends keyof RequiredDateTimePattern>(
      key: T
    ) => SingleSelectionHandler<RequiredDateTimePattern[T]>
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
            ...pattern,
            time: pattern.time ?? fallbackState.time,
            date: undefined,
          });
        case "date":
          return onPatternChange({
            ...pattern,
            time: undefined,
            date: pattern.date ?? fallbackState.date,
          });
        case "both":
          return onPatternChange({
            ...pattern,
            time: pattern.time ?? fallbackState.time,
            date: pattern.date ?? fallbackState.date,
          });
      }
    },
    [onPatternChange, pattern, fallbackState]
  );

  const onSwitchChange = useCallback<
    React.ChangeEventHandler<HTMLInputElement>
  >(
    (e) => {
      const { checked: showTimeZone } = e.target;
      onPatternChange({ ...pattern, showTimeZone });
    },
    [onPatternChange, pattern]
  );

  return { onDropdownChange, onSwitchChange, onToggleChange };
}
