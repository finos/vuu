import { queryClosest } from "@finos/vuu-utils";
import {
  Dropdown,
  DropdownProps,
  FormField,
  FormFieldLabel,
  Input,
  Option,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  ToggleButtonGroupProps,
} from "@salt-ds/core";
import { FormEventHandler, SyntheticEvent, useCallback } from "react";
import { ApplicatonSettingsPanelProps } from "./ApplicationSettingsPanel";

export type Option<T> = { label: string; value: T };
// Schema type definitions
export const isOption = (
  value: Option<number | string> | number | string
): value is Option<number | string> =>
  typeof value === "object" && "label" in value && "label" in value;

export interface BaseProperty {
  name: string;
  label: string;
}

export interface StringProperty extends BaseProperty {
  values?: string[] | Option<string>[];
  defaultValue?: string;
  type: "string";
}
export interface NumericProperty extends BaseProperty {
  values?: number[] | Option<number>[];
  defaultValue?: number;
  type: "number";
}
export interface BooleanProperty extends BaseProperty {
  defaultValue?: boolean;
  type: "boolean";
}

export type SettingsProperty =
  | StringProperty
  | NumericProperty
  | BooleanProperty;

export const isBooleanProperty = (
  property: SettingsProperty
): property is BooleanProperty => property.type === "boolean";

export const isStringOrNumber = (value: unknown): value is string | number =>
  typeof value === "string" || typeof value === "number";

export interface SettingsSchema {
  properties: SettingsProperty[];
}

const getValueAndLabel = (value: string | number | Option<string | number>) =>
  isOption(value) ? [value.value, value.label] : [value, value];

// Determine the form control type to be displayed
export function getFormControl(
  property: SettingsProperty,
  changeHandler: FormEventHandler,
  selectHandler: DropdownProps["onSelectionChange"],
  currentValue?: string | boolean | number
) {
  if (isBooleanProperty(property)) {
    const checked =
      typeof currentValue === "boolean"
        ? currentValue
        : property.defaultValue ?? false;

    return (
      <Switch
        checked={checked}
        label={property.label}
        onChange={changeHandler}
      ></Switch>
    );
  }
  // Toggle Box for 1 or 2 values
  if (Array.isArray(property.values)) {
    if (property.values.length <= 2) {
      return (
        <ToggleButtonGroup
          value={currentValue as ToggleButtonGroupProps["value"]}
          onChange={changeHandler}
        >
          {property.values.map((valueOrOption) => {
            const [value, label] = getValueAndLabel(valueOrOption);
            return (
              <ToggleButton key={value} value={value}>
                {label}
              </ToggleButton>
            );
          })}
        </ToggleButtonGroup>
      );
    } else if (property.values.length > 2) {
      return (
        <Dropdown
          value={currentValue as DropdownProps["value"]}
          onSelectionChange={selectHandler}
        >
          {property.values.map((valueOrOption) => {
            const [value, label] = getValueAndLabel(valueOrOption);
            return (
              <Option value={value} key={value} data-field={property.name}>
                {label}
              </Option>
            );
          })}
        </Dropdown>
      );
    }
  } else {
    const value = isStringOrNumber(currentValue)
      ? currentValue
      : isStringOrNumber(property.defaultValue)
      ? property.defaultValue
      : "";
    return <Input value={value} />;
  }
}

// Generates application settings form component
export const SettingsForm = ({
  applicationSettingsSchema,
  applicationSettings,
  onApplicationSettingChanged,
}: ApplicatonSettingsPanelProps) => {
  const getFieldNameFromEventTarget = (evt: SyntheticEvent) => {
    const fieldElement = queryClosest(evt.target, "[data-field]");
    if (fieldElement && fieldElement.dataset.field) {
      return fieldElement.dataset.field;
    } else {
      throw Error("data-field attribute not defined");
    }
  };

  // Change Handler for toggle and input buttons
  const changeHandler = useCallback<FormEventHandler>(
    (event) => {
      const fieldName = getFieldNameFromEventTarget(event);
      const { checked, value } = event.target as HTMLInputElement;
      onApplicationSettingChanged(fieldName, checked ?? value);
    },
    [onApplicationSettingChanged]
  );

  // Change handler for selection form controls
  const selectHandler = useCallback(
    (event: SyntheticEvent, [selected]: string[]) => {
      const fieldName = getFieldNameFromEventTarget(event);
      onApplicationSettingChanged(fieldName, selected);
    },
    [onApplicationSettingChanged]
  );

  return (
    <div>
      {applicationSettingsSchema.properties.map((property) => (
        <FormField data-field={property.name} key={property.name}>
          <FormFieldLabel>{property.label}</FormFieldLabel>
          {getFormControl(
            property,
            changeHandler,
            selectHandler,
            applicationSettings[property.name]
          )}
        </FormField>
      ))}
    </div>
  );
};
