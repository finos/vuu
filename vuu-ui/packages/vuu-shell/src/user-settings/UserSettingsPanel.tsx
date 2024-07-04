import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { HTMLAttributes } from "react";
import { useApplicationSettings } from "../application-provider";
import { SettingsForm } from "./SettingsForm";
import cx from "clsx";

import userSettingsPanelCss from "./UserSettingsPanel.css";

export type UserSettingsPanelProps = HTMLAttributes<HTMLDivElement>;

const classBase = "vuuUserSettingsPanel";

export const UserSettingsPanel = ({
  ...htmlAttributes
}: UserSettingsPanelProps) => {
  const targetWindow = useWindow();

  const {
    onUserSettingChanged,
    userSettings = {},
    userSettingsSchema,
  } = useApplicationSettings();

  useComponentCssInjection({
    testId: "vuu-user-settings-panel",
    css: userSettingsPanelCss,
    window: targetWindow,
  });

  // Without a schema, we can't render a form
  // We could render a list of input boxes but lets require a schema for now.
  if (userSettingsSchema) {
    return (
      <div {...htmlAttributes} className={cx(classBase, "vuuScrollable")}>
        <SettingsForm
          settings={userSettings}
          settingsSchema={userSettingsSchema}
          onSettingChanged={onUserSettingChanged}
        />
      </div>
    );
  } else {
    console.warn("no settingsSchema provided to UserSettingsPanel");
    return null;
  }
};
