import {
  ApplicationSettingsPanel,
  ApplicationProvider,
} from "@finos/vuu-shell";
import { SettingsSchema } from "packages/vuu-shell/src/application-settings/SettingsForm";

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
    <ApplicationProvider
      changeSetting={handlePropertyChanged}
      applicationSettings={initialSettings}
      applicationSettingsSchema={applicationSettingsSchema}
    >
      <ApplicationSettingsPanel
        applicationSettingsSchema={applicationSettingsSchema}
        applicationSettings={applicationSettings}
        onApplicationSettingChanged={handlePropertyChanged}
      />
    </ApplicationProvider>
  );
};
DefaultApplicationSettingsForm.displaySequence = displaySequence++;
