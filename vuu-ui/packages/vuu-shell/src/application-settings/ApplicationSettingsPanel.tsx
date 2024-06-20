import { getFieldName, queryClosest } from "@finos/vuu-utils";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window"; 
import { FormEventHandler, HTMLAttributes, useCallback } from "react";
import applicationSettingsPanelCss from "./ApplicationSettingsPanel.css";
import {
  FormField,
  FormFieldLabel,
  Input,
  Dropdown,
  ToggleButton,
  ToggleButtonGroup,
  Option,
  Switch,
} from "@salt-ds/core";
import { useApplicationSettings } from "../application-provider";
import { SettingsProperty, SettingsSchema } from "./ApplicationSettingsTypes";
import schema from "./ApplicationSettingsSchema.json";
import { SingleSelectionHandler } from "packages/vuu-ui-controls/src";

// Determine the box type to be displayed
function getFormControl(property: SettingsProperty, changeHandler, selectHandler) {
  const values = property.values;
  const defaultValue = property.defaultValue;
  
  if (values?.length !== undefined) {
    // Switch for booleans
    if (values?.length == 2) {
        if (property.type === "boolean") {
            return (
                <Switch 
                label={property.label}
                defaultChecked={defaultValue} 
                onChange={changeHandler}
                ></Switch>
            )
        }
    }
    // Toggle Box for 1 or 2 values
    if (values?.length <= 2) {
        return (
        <ToggleButtonGroup 
        defaultValue={defaultValue}
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
            onSelectionChange={selectHandler}
            >
                {values?.map((value) => {
                    if (typeof value === "object") {
                        return(
                        <Option value={value.label} key={value.value}></Option>
                        )
                    }
                    else {
                        return (
                            <Option value={value} key={value}></Option>
                        )
                    }
                })}
            </Dropdown>
        )
   } else {
    return <Input></Input>;
  }
}
}

// Generates application settings form
const SettingsForm = ({ properties, changeHandler, selectHandler }: {properties :SettingsSchema}) => {
  return (
    <div>
      {properties.map((property: string | number | boolean) => (
        <FormField data-field={property.name} key={property.name}>
          <FormFieldLabel>{property.label}</FormFieldLabel>
          {getFormControl(property, changeHandler, selectHandler)}
        </FormField>
      ))}
    </div>
  );
}


//Props for Panel
export interface ApplicatonSettingsPanelProps
  extends HTMLAttributes<HTMLDivElement> {
  applicationSettingsSchema: SettingsSchema;
  applicationSettings: Record<string, string | number | boolean>;
  onApplicationSettingChanged: (propertyName: string, value: string | number | boolean) => void;
}

const classBase = "vuuApplicationSettingsPanel";

export const ApplicationSettingsPanel = () => {

  const { changeSetting } = useApplicationSettings();

  const targetWindow = useWindow();

  useComponentCssInjection({
    testId: "vuu-application-settings-panel",
    css: applicationSettingsPanelCss,
    window: targetWindow,
  });

  const onSettingChanged = useCallback<FormEventHandler>((event) => {
    const fieldElement = queryClosest(event.target, "[data-field]");
    console.log(fieldElement) 
    const fieldName = getFieldName(fieldElement)
    changeSetting(fieldName, event.target.checked)
  }, [changeSetting])

  const handleSelectionChange = useCallback<SingleSelectionHandler>(
    (event, selected) => {
      console.log(event.target)
    },
    []
  );

  return (
    <div className={classBase}>
      <SettingsForm properties={schema.properties} changeHandler={onSettingChanged} selectHandler={handleSelectionChange}/>
    </div>
  );
};



