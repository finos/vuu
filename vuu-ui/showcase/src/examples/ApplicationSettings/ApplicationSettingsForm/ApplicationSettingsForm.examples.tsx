import {
  ApplicationSettingsPanel,
  type SettingsSchema,
} from "@finos/vuu-shell";
import { useState } from "react";

let displaySequence = 1;

export const DefaultApplicationSettingsForm = () => {
  const initialSettings = {
    themeMode: "light",
    dateFormatPattern: "dd/mm/yyyy",
    region: "US",
    greyscale: false,
  };

  const applicationSettingsSchema: SettingsSchema = {
    properties: [
      {
        name: "themeMode",
        label: "Mode",
        values: ["light", "dark"],
        defaultValue: "light",
        type: "string",
      },
      {
        name: "dateFormatPattern",
        label: "Date Formatting",
        values: ["dd/mm/yyyy", "mm/dd/yyyy", "dd MMMM yyyy"],
        defaultValue: "dd/mm/yyyy",
        type: "string",
      },
      {
        name: "region",
        label: "Region",
        values: [
          { value: "us", label: "US" },
          { value: "apac", label: "Asia Pacific" },
          { value: "emea", label: "Europe, Middle East & Africa" },
        ],
        defaultValue: "apac",
        type: "string",
      },
      {
        name: "greyscale",
        label: "Greyscale",
        values: [true, false],
        defaultValue: false,
        type: "boolean",
      },
    ],
  };
  const [applicationSettings, setApplicationSettings] =
    useState(initialSettings);

  const handlePropertyChanged = (
    propertyName: string,
    value: string | boolean | number
  ) => {
    setApplicationSettings((currentSettings) => ({
      ...currentSettings,
      [propertyName]: value,
    }));
  };

  return (
    <ApplicationSettingsPanel
      applicationSettingsSchema={applicationSettingsSchema}
      applicationSettings={applicationSettings}
      onApplicationSettingChanged={handlePropertyChanged}
    />
  );
};
DefaultApplicationSettingsForm.displaySequence = displaySequence++;
