import { VuuRowDataItemType } from "@finos/vuu-protocol-types";
import { queryClosest, Settings } from "@finos/vuu-utils";
import {
  Dropdown,
  DropdownProps,
  FormField,
  FormFieldLabel,
  Option,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  ToggleButtonGroupProps,
} from "@salt-ds/core";
import { VuuInput } from "@finos/vuu-ui-controls";
import {
  FormEventHandler,
  HTMLAttributes,
  SyntheticEvent,
  useCallback,
  useState,
} from "react";
export interface SettingsSchema {
  properties: SettingsProperty[];
}

export interface SettingsProps {
  settingsSchema: SettingsSchema;
  settings: Settings;
  onSettingChanged: (
    propertyName: string,
    value: string | number | boolean
  ) => void;
}

export type Option<T> = { label: string; value: T };

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

const getValueAndLabel = (value: string | number | Option<string | number>) =>
  isOption(value) ? [value.value, value.label] : [value, value];

const defaultPropertyValue: Record<
  SettingsProperty["type"],
  VuuRowDataItemType
> = {
  boolean: false,
  number: 0,
  string: "",
};

// Determine the form control type to be displayed
export function FormControl({
  property,
  changeHandler,
  selectHandler,
  inputHandler,
  currentValue = property.defaultValue ?? defaultPropertyValue[property.type],
}: {
  property: SettingsProperty;
  changeHandler: FormEventHandler;
  selectHandler: DropdownProps["onSelectionChange"];
  inputHandler: FormEventHandler;
  currentValue: VuuRowDataItemType;
}) {
  const [value, setValue] = useState(currentValue);
  if (isBooleanProperty(property)) {
    const checked =
      typeof currentValue === "boolean"
        ? currentValue
        : property.defaultValue ?? false;

    return <Switch checked={checked} onChange={changeHandler}></Switch>;
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
              <Option
                value={label}
                key={value}
                data-field={property.name}
              ></Option>
            );
          })}
        </Dropdown>
      );
    }
  } else {
    const valid = isValidInput(currentValue, property.type);
    const content = getTooltipContent(property.type, valid);
    const TooltipProps = {
      tooltipContent: content,
    };
    return (
      <VuuInput
        key={property.name}
        onCommit={inputHandler}
        onChange={(e) => setValue((e.target as HTMLInputElement).value)}
        validationStatus={valid}
        TooltipProps={TooltipProps}
        value={value as string}
      />
    );
  }
  return null;
}

//Validation logic for input boxes
const isValidInput = (value: unknown, type: unknown) => {
  if (value === "") {
    return undefined;
  }
  if (type === "string") {
    return "success";
  } else if (type === "number") {
    if (Number.isNaN(Number(value))) {
      return "error";
    }
    return "success";
  }
};

//Function to Generate Tooltip Content
function getTooltipContent(type: string, valid: string | undefined) {
  if (valid === "error") {
    if (type === "number") {
      return <p>Field is expecting a number</p>;
    } else if (type === "string") {
      return <p>Field is expecting a string</p>;
    } else {
      return <p>Please contact Admin for more information on expected type</p>;
    }
  } else {
    return undefined;
  }
}

export type SettingsFormProps = SettingsProps & HTMLAttributes<HTMLDivElement>;

// Generates application settings form component
export const SettingsForm = ({
  settingsSchema,
  settings,
  onSettingChanged,
  ...htmlAttributes
}: SettingsFormProps) => {
  const getFieldNameFromEventTarget = (evt: SyntheticEvent) => {
    const fieldElement = queryClosest(evt.target, "[data-field]");
    if (fieldElement && fieldElement.dataset.field) {
      return fieldElement.dataset.field;
    } else {
      throw Error("data-field attribute not defined");
    }
  };

  // Change Handler for toggle and switch buttons
  const changeHandler = useCallback<FormEventHandler>(
    (event) => {
      const fieldName = getFieldNameFromEventTarget(event);
      const { checked, value } = event.target as HTMLInputElement;
      onSettingChanged(fieldName, checked ?? value);
    },
    [onSettingChanged]
  );

  // Change handler for selection form controls
  const selectHandler = useCallback(
    (event: SyntheticEvent, [selected]: string[]) => {
      const fieldName = getFieldNameFromEventTarget(event);
      onSettingChanged(fieldName, selected);
    },
    [onSettingChanged]
  );

  // Change Handler for input boxes
  const inputHandler = useCallback<FormEventHandler>(
    (event) => {
      const fieldName = getFieldNameFromEventTarget(event);
      const { value } = event.target as HTMLInputElement;
      if (!Number.isNaN(Number(value)) && value != "") {
        const numValue = Number(value);
        onSettingChanged(fieldName, numValue);
      } else {
        onSettingChanged(fieldName, value);
      }
    },
    [onSettingChanged]
  );
  return (
    <div {...htmlAttributes}>
      {settingsSchema.properties.map((property) => (
        <FormField data-field={property.name} key={property.name}>
          <FormFieldLabel>{property.label}</FormFieldLabel>
          {FormControl({
            property,
            changeHandler,
            selectHandler,
            inputHandler,
            currentValue: settings[property.name],
          })}
        </FormField>
      ))}
    </div>
  );
};
