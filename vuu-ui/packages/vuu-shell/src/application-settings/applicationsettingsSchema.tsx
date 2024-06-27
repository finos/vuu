import type { SettingsSchema } from "@finos/vuu-shell";

export const applicationSettingsSchema: SettingsSchema = {
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
        { value: "apac", label: "apac (Asia Pacific)" },
        { value: "emea", label: "emea (Europe, Middle East & Africa)" },
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

export default applicationSettingsSchema;
