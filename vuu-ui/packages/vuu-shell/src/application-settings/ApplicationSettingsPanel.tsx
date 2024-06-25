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
import { SingleSelectionHandler } from "@finos/vuu-ui-controls";
import { FormEventHandler, HTMLAttributes, useCallback } from "react";
import { useApplicationSettings } from "../application-provider";

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
  property: SettingsSchema,
  changeHandler: FormEventHandler,
  selectHandler: SingleSelectionHandler,
  currentValue: ApplicatonSettingsPanelProps
) {
  const values = property.values;
  const defaultValue = property.defaultValue;

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
        <ToggleButtonGroup
          // defaultValue={defaultValue}
          value={currentValue}
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
        <Dropdown onSelectionChange={selectHandler} value={currentValue}>
          {values?.map((value) => {
            if (typeof value === "object") {
              return <Option value={value.label} key={value.value}></Option>;
            } else {
              return <Option value={value} key={value}></Option>;
            }
          })}
        </Dropdown>
      );
    } else {
      return <Input></Input>;
    }
  }
}

//Props for Panel
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
}: ApplicatonSettingsPanelProps) => {
  const { changeSetting } = useApplicationSettings();

  const onSettingChanged = useCallback<FormEventHandler>(
    (event) => {
      const fieldElement = queryClosest(event.target, "[data-field]");
      const fieldName = getFieldName(fieldElement);
      changeSetting(fieldName, event.target.value);
    },
    [changeSetting]
  );

  // Seperate change handler for selection form controls (to be implemented)
  const handleSelectionChange = useCallback<SingleSelectionHandler>((event) => {
    console.log(event.target);
  }, []);

  // const selectHandler = useCallback((evt, [selectedValue]) => {
  //   const propertyName = getPropertyNameFromElement(evt.target);
  //   onSettingChanged(propertyName, selectedValue);
  // });

  // const changeHandler = useCallback((evt) => {
  //   const propertyName = getFieldName(evt.target);
  //   const value = getTypedValue(
  //     evt.target,
  //     propertyName,
  //     applicationSettingsSchema
  //   );
  //   onSettingChanged(propertyName, value);
  // },[]);

  return (
    <div>
      {applicationSettingsSchema.properties.map((property: SettingsProperty<string>) => (
        <FormField data-field={property.name} key={property.name}>
          <FormFieldLabel>{property.label}</FormFieldLabel>
          {getFormControl(
            applicationSettingsSchema,
            onSettingChanged,
            handleSelectionChange,
            applicationSettings
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
        properties={applicationSettingsSchema.properties}
        currentValue={applicationSettings}
      />
    </div>
  );
};

export default ApplicationSettingsPanel;
