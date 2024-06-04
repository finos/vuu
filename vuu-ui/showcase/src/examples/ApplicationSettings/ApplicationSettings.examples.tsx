import "./ApplicationSettings.examples.css";
import {
  FormField,
  FormFieldLabel,
  Input
} from "@salt-ds/core";
import { SettingsSchema } from "./ApplicationSettingsTypes";
import schema from "./ApplicationSettingsSchema.json";

function SettingsForm({ properties }: SettingsSchema) {
  return (
    <div>
      {properties.map((property) => (
        <FormField key={property.name}>
          <FormFieldLabel>{property.label}</FormFieldLabel>
          <Input></Input>
        </FormField>
      ))}
    </div>
  );
}

export const ApplicationSettings = () => {
  return (
    <div className="applicationSettings">
      <SettingsForm properties={schema.properties} />
    </div>
  );
};

export default ApplicationSettings;
