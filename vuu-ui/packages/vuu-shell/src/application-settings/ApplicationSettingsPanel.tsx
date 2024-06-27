import { getFieldName, queryClosest } from "@finos/vuu-utils";
import {
  Dropdown,
  FormField,
  FormFieldLabel,
  Input,
  Option,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
} from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import {
  SingleSelectionHandler,
} from "@finos/vuu-ui-controls";
import { FormEventHandler, HTMLAttributes, useCallback } from "react";

import applicationSettingsPanelCss from "./ApplicationSettingsPanel.css";

// Type definitions
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
  selectHandler: SingleSelectionHandler,
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
            value={currentValue}
            onChange={changeHandler}
          ></Switch>
        );
      }
    }
    // Toggle Box for 1 or 2 values
    if (values?.length <= 2) {
      return (
        <ToggleButtonGroup value={currentValue} onChange={changeHandler}>
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
        <Dropdown value={currentValue} onSelectionChange={selectHandler}>
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

// Gets the field form element for a dropdown selection box for selection change handler
export const queryFieldFormElement = <T extends HTMLElement = HTMLElement>(
  el: HTMLElement | EventTarget | null
) => {
  if (el === null) {
    return null;
  }
  const dataFieldValue = el.getAttribute("data-field");
  const saltFormField = document.querySelector(".saltFormField") as HTMLElement;
  if (saltFormField && saltFormField.dataset.field) {
    return document.querySelector(`[data-field="${dataFieldValue}"]`);
  }
};

// Generates application settings form component
export const SettingsForm = ({
  applicationSettingsSchema,
  applicationSettings,
  onApplicationSettingChanged,
}: ApplicatonSettingsPanelProps) => {
  // Settings Handler for toggle and input buttons
  const onSettingChanged = useCallback<FormEventHandler>((event) => {
    const fieldElement = queryClosest(event.target, "[data-field]");
    const fieldName = getFieldName(fieldElement);
    onApplicationSettingChanged(fieldName, event.target.value);
  }, []);

  // Seperate change handler for selection form controls (to be implemented)
  const handleSelectionChange = useCallback<SingleSelectionHandler>(
    (event, selected) => {
      console.log(event.target);
      const fieldElement = queryFieldFormElement(event.target);
      const fieldName = getFieldName(fieldElement);
      onApplicationSettingChanged(fieldName, selected);
    },
    []
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
}: ApplicatonSettingsPanelProps) => {
  const targetWindow = useWindow();

  useComponentCssInjection({
    testId: "vuu-application-settings-panel",
    css: applicationSettingsPanelCss,
    window: targetWindow,
  });

  return (
    <div className={classBase}>
      <SettingsForm
        applicationSettingsSchema={applicationSettingsSchema}
        applicationSettings={applicationSettings}
        onApplicationSettingChanged={onApplicationSettingChanged}
      />
    </div>
  );
};

export default ApplicationSettingsPanel;
