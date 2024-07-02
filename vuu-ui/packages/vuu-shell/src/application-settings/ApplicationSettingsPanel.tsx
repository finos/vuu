import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { HTMLAttributes } from "react";
import { SettingsForm } from "./SettingsForm";

import applicationSettingsPanelCss from "./ApplicationSettingsPanel.css";
import { useApplicationSettings } from "../application-provider";

// Props for Panel
export type ApplicatonSettingsPanelProps = HTMLAttributes<HTMLDivElement>;

const classBase = "vuuApplicationSettingsPanel";

export const ApplicationSettingsPanel = ({
  ...htmlAttributes
}: ApplicatonSettingsPanelProps) => {
  const targetWindow = useWindow();

  const {
    onApplicationSettingChanged,
    applicationSettings = {},
    applicationSettingsSchema,
  } = useApplicationSettings();

  useComponentCssInjection({
    testId: "vuu-application-settings-panel",
    css: applicationSettingsPanelCss,
    window: targetWindow,
  });

  // Without a schema, we can't render a form
  // We could render a list of input boxes but lets require a schema for now.
  if (applicationSettingsSchema) {
    return (
      <div {...htmlAttributes} className={classBase}>
        <SettingsForm
          applicationSettingsSchema={applicationSettingsSchema}
          applicationSettings={applicationSettings}
          onApplicationSettingChanged={onApplicationSettingChanged}
        />
      </div>
    );
  } else {
    console.warn("no settingsSchema provided to ApplicationSettingsPanel");
    return null;
  }
};
