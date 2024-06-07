import "./ApplicationSettings.examples.css";
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
import { SettingsProperty, SettingsSchema } from "./ApplicationSettingsTypes";
import schema from "./ApplicationSettingsSchema.json";

// Determine the box type to be displayed
function BoxType(property: SettingsProperty) {
  const values = property.values;
  
  if (values?.length !== undefined) {
    // Switch for booleans
    if (values?.length == 2) {
        if (property.type === "boolean") {
            return (
                <Switch label={property.label}></Switch>
            )
        }
    }
    // Toggle Box for 1 or 2 values
    if (values?.length <= 2) {
        return (
        <ToggleButtonGroup>
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
            <Dropdown>
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

// Generic Form Generator
function SettingsForm({ properties }: SettingsSchema) {
  return (
    <div>
      {properties.map((property) => (
        <FormField key={property.name}>
          <FormFieldLabel>{property.label}</FormFieldLabel>
          {BoxType(property)}
        </FormField>
      ))}
    </div>
  );
}

// ApplicationSettings form using imported JSON
export const ApplicationSettings = () => {
  return (
    <div className="applicationSettings">
      <SettingsForm properties={schema.properties} />
    </div>
  );
};

export default ApplicationSettings;