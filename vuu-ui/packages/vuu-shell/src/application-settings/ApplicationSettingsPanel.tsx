import { queryClosest } from "@finos/vuu-utils";
import {
  Dropdown,
  DropdownProps,
  FormField,
  FormFieldLabel,
  Input,
  Option,
  Switch,
  SwitchProps,
  ToggleButton,
  ToggleButtonGroup,
  ToggleButtonGroupProps,
} from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import {
  FormEventHandler,
  HTMLAttributes,
  SyntheticEvent,
  useCallback,
} from "react";

import applicationSettingsPanelCss from "./ApplicationSettingsPanel.css";

// Schema type definitions
export type SettingsProperty<
  T extends string | number | boolean | object = string
> = {
  name: string;
  label: string;
  values?: T[] | object;
  defaultValue?: T;
  type: "string" | "boolean" | "number";
};

export interface SettingsSchema {
  properties: SettingsProperty[];
}

// Determine the form control type to be displayed
export function getFormControl(
  property: SettingsProperty,
  changeHandler: FormEventHandler,
  selectHandler: DropdownProps["onSelectionChange"],
  currentValue: string | boolean | number
) {
  const values = property.values;

  if (values?.length !== undefined) {
    // Switch for booleans
    if (values?.length == 2) {
      if (property.type === "boolean") {
        return (
          <Switch
            label={property.label}
            value={currentValue as SwitchProps["value"]}
            onChange={changeHandler}
          ></Switch>
        );
      }
    }
    // Toggle Box for 1 or 2 values
    if (values?.length <= 2) {
      return (
        <ToggleButtonGroup
          value={currentValue as ToggleButtonGroupProps["value"]}
          onChange={changeHandler}
        >
          {values?.map((value) => (
            <ToggleButton key={value} value={value}>
              {value}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      );

      // Dropdown for more than 2 values provided
    } else if (values?.length > 2) {
      return (
        <Dropdown
          value={currentValue as DropdownProps["value"]}
          onSelectionChange={selectHandler}
        >
          {values?.map((value) => {
            if (typeof value === "object") {
              return (
                <Option
                  value={value.label}
                  key={value.value}
                  data-field={property.name}
                ></Option>
              );
            } else {
              return (
                <Option
                  value={value}
                  key={value}
                  data-field={property.name}
                ></Option>
              );
            }
          })}
        </Dropdown>
      );
    }
  } else {
    return <Input></Input>;
  }
}

// Props for Panel
export interface ApplicatonSettingsPanelProps
  extends HTMLAttributes<HTMLDivElement> {
  applicationSettingsSchema: SettingsSchema;
  applicationSettings: Record<string, string | number | boolean>;
  onApplicationSettingChanged: (
    propertyName: string,
    value: string | number | boolean
  ) => void;
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
  const onSettingChanged = useCallback<FormEventHandler>(
    (event) => {
      const fieldName = getFieldNameFromEventTarget(event);
      onApplicationSettingChanged(fieldName, event.target.value);
    },
    [onApplicationSettingChanged]
  );

  // Change handler for selection form controls
  const handleSelectionChange = useCallback(
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
            onSettingChanged,
            handleSelectionChange,
            applicationSettings[property.name]
          )}
        </FormField>
      ))}
    </div>
  );
};

const classBase = "vuuApplicationSettingsPanel";

export const ApplicationSettingsPanel = ({
  applicationSettingsSchema,
  applicationSettings,
  onApplicationSettingChanged,
  ...htmlAttributes
}: ApplicatonSettingsPanelProps) => {
  const targetWindow = useWindow();

  useComponentCssInjection({
    testId: "vuu-application-settings-panel",
    css: applicationSettingsPanelCss,
    window: targetWindow,
  });

  return (
    <div {...htmlAttributes} className={classBase}>
      <SettingsForm
        applicationSettingsSchema={applicationSettingsSchema}
        applicationSettings={applicationSettings}
        onApplicationSettingChanged={onApplicationSettingChanged}
      />
    </div>
  );
};

export default ApplicationSettingsPanel;
