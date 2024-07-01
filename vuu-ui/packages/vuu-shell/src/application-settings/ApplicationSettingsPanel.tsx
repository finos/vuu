import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { HTMLAttributes } from "react";
import { SettingsForm, SettingsSchema } from "./SettingsForm";

import applicationSettingsPanelCss from "./ApplicationSettingsPanel.css";

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

const classBase = "vuuApplicationSettingsPanel";

export const ApplicationSettingsPanel = ({
  applicationSettingsSchema,
  applicationSettings,
  onApplicationSettingChanged,
  ...htmlAttributes
}: ApplicatonSettingsPanelProps) => {
  const targetWindow = useWindow();

  useComponentCssInjection({
    testId: "vuu-application-settings-panel",
    css: applicationSettingsPanelCss,
    window: targetWindow,
  });

  return (
    <div {...htmlAttributes} className={classBase}>
      <SettingsForm
        applicationSettingsSchema={applicationSettingsSchema}
        applicationSettings={applicationSettings}
        onApplicationSettingChanged={onApplicationSettingChanged}
      />
    </div>
  );
};
