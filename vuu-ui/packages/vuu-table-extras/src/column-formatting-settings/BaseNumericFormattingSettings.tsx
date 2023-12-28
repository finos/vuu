import { FormField, FormFieldLabel, Input, Switch } from "@salt-ds/core";
import { ColumnTypeFormatting } from "@finos/vuu-table-types";
import { getTypeFormattingFromColumn } from "@finos/vuu-utils";
import {
  ChangeEvent,
  KeyboardEvent,
  SyntheticEvent,
  useCallback,
  useState,
} from "react";
import { FormattingSettingsProps } from "./types";

const classBase = "vuuFormattingSettings";

export const BaseNumericFormattingSettings = ({
  column,
  onChangeFormatting: onChange,
}: FormattingSettingsProps) => {
  const [formattingSettings, setFormattingSettings] =
    useState<ColumnTypeFormatting>(getTypeFormattingFromColumn(column));

  const handleInputKeyDown = useCallback(
    (evt: KeyboardEvent<HTMLInputElement>) => {
      if (evt.key === "Enter" || evt.key === "Tab") {
        onChange(formattingSettings);
      }
    },
    [formattingSettings, onChange]
  );

  const handleChangeDecimals = useCallback(
    (evt: SyntheticEvent) => {
      const { value } = evt.target as HTMLFormElement;
      const numericValue: number | undefined =
        value === ""
          ? undefined
          : isNaN(parseInt(value))
          ? undefined
          : parseInt(value);

      const newFormattingSettings = {
        ...formattingSettings,
        decimals: numericValue,
      };
      setFormattingSettings(newFormattingSettings);
    },
    [formattingSettings]
  );

  const handleChangeAlignDecimals = useCallback(
    (evt: ChangeEvent<HTMLInputElement>) => {
      const { checked } = evt.target as HTMLInputElement;
      const newFormattingSettings = {
        ...formattingSettings,
        alignOnDecimals: checked,
      };
      setFormattingSettings(newFormattingSettings);
      onChange(newFormattingSettings);
    },
    [formattingSettings, onChange]
  );

  const handleChangeZeroPad = useCallback(
    (evt: ChangeEvent<HTMLInputElement>) => {
      const { checked } = evt.target as HTMLInputElement;
      const newFormattingSettings = {
        ...formattingSettings,
        zeroPad: checked,
      };
      setFormattingSettings(newFormattingSettings);
      onChange(newFormattingSettings);
    },
    [formattingSettings, onChange]
  );

  return (
    <div className={classBase}>
      <FormField data-field="decimals">
        <FormFieldLabel>Number of decimals</FormFieldLabel>
        <Input
          className="vuuInput"
          onChange={handleChangeDecimals}
          onKeyDown={handleInputKeyDown}
          value={formattingSettings.decimals ?? ""}
        />
      </FormField>

      <FormField labelPlacement="left">
        <FormFieldLabel>Align on decimals</FormFieldLabel>
        <Switch
          checked={formattingSettings.alignOnDecimals ?? false}
          onChange={handleChangeAlignDecimals}
          value="align-decimals"
        />
      </FormField>
      <FormField labelPlacement="left">
        <FormFieldLabel>Zero pad decimals</FormFieldLabel>
        <Switch
          checked={formattingSettings.zeroPad ?? false}
          onChange={handleChangeZeroPad}
          value="zero-pad"
        />
      </FormField>
    </div>
  );
};
