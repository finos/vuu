import { FormField, FormFieldLabel, Input } from "@salt-ds/core";
import { Switch } from "@salt-ds/lab";
import { ColumnDescriptor, TypeFormatting } from "@finos/vuu-datagrid-types";
import { getTypeSettingsFromColumn } from "@finos/vuu-utils";
import {
  ChangeEvent,
  KeyboardEvent,
  SyntheticEvent,
  useCallback,
  useState,
} from "react";

const classBase = "vuuFormattingSettings";

export interface NumericFormattingSettingsProps {
  column: ColumnDescriptor;
  onChange: (formatting: TypeFormatting) => void;
}

export const NumericFormattingSettings = ({
  column,
  onChange,
}: NumericFormattingSettingsProps) => {
  const [formattingSettings, setFormattingSettings] = useState<TypeFormatting>(
    getTypeSettingsFromColumn(column)
  );

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
