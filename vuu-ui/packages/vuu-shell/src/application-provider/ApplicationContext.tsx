import type { ThemeMode, VuuUser } from "@finos/vuu-utils";
import { createContext } from "react";
import { SettingsSchema } from "../application-settings/SettingsForm";

// export interface CoreSettings {
//   themeMode: ThemeMode;
// }

const Guest: VuuUser = {
  username: "unknown",
  token: "",
};

export interface ApplicationContextProps {
  onApplicationSettingChanged: (propertyName: string, value: unknown) => void;
  applicationSettings: Record<string, string | number | boolean>;
  applicationSettingsSchema: SettingsSchema;
  user: VuuUser;
}

export const ApplicationContext = createContext<ApplicationContextProps>({
  onApplicationSettingChanged: (propertyName: string) =>
    console.log(
      `Cannot change setting '${propertyName}'.\nDid you forget to declare an ApplicationProvider ?`
    ),
  applicationSettings: {
    themeMode: "light",
    dateFormatPattern: "dd MMMM yyyy",
    region: "apac",
    greyscale: false,
  },
  applicationSettingsSchema: {
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
  },
  user: Guest,
});
