import {
  ApplicationSettingsPanel,
  ApplicationProvider,
} from "@finos/vuu-shell";
import { SettingsSchema } from "packages/vuu-shell/src/application-settings/SettingsForm";

import { useState } from "react";

let displaySequence = 1;

// Showcase example showing the current default settings form
export const DefaultApplicationSettingsForm = () => {
  const initialSettings = {
    themeMode: "light",
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
    ],
  };
  const [applicationSettings, setApplicationSettings] =
    useState(initialSettings);

  const handlePropertyChanged = (propertyName: string, value: unknown) => {
    setApplicationSettings((currentSettings) => ({
      ...currentSettings,
      [propertyName]: value,
    }));
  };

  return (
    <ApplicationProvider
      onApplicationSettingChanged={handlePropertyChanged}
      applicationSettings={applicationSettings}
      applicationSettingsSchema={applicationSettingsSchema}
    >
      <ApplicationSettingsPanel />
    </ApplicationProvider>
  );
};
DefaultApplicationSettingsForm.displaySequence = displaySequence++;


// Showcase example showing different form controls
export const VariedFormControlApplicationSettingsForm = () => {
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

  const handlePropertyChanged = (propertyName: string, value: unknown) => {
    setApplicationSettings((currentSettings) => ({
      ...currentSettings,
      [propertyName]: value,
    }));
  };

  return (
    <ApplicationProvider
      onApplicationSettingChanged={handlePropertyChanged}
      applicationSettings={applicationSettings}
      applicationSettingsSchema={applicationSettingsSchema}
    >
      <ApplicationSettingsPanel />
    </ApplicationProvider>
  );
};
VariedFormControlApplicationSettingsForm.displaySequence = displaySequence++;

