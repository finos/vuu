import { getFieldName, queryClosest } from "@finos/vuu-utils";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { FormEventHandler, HTMLAttributes, useCallback } from "react";

import applicationSettingsPanelCss from "./ApplicationSettingsPanel.css";
import {
  FormField,
  FormFieldLabel,
  ToggleButton,
  ToggleButtonGroup,
} from "@salt-ds/core";
import { useApplicationSettings } from "../application-provider";

export interface ApplicationSettingsPanelProps
  extends HTMLAttributes<HTMLDivElement> {
  settings: { [key: string]: unknown };
}

const classBase = "vuuApplicationSettingsPanel";

export const ApplicationSettingsPanel = () => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-application-settings-panel",
    css: applicationSettingsPanelCss,
    window: targetWindow,
  });

  const { changeSetting, settings } = useApplicationSettings();

  const onChangeToggleButton = useCallback<FormEventHandler>(
    (e) => {
      const button = queryClosest<HTMLButtonElement>(e.target, "button");
      if (button) {
        const fieldName = getFieldName(button);
        const { value } = button;
        changeSetting(fieldName, value);
      }
    },
    [changeSetting]
  );

  return (
    <div className={classBase}>
      <FormField data-field="themeMode">
        <FormFieldLabel>Light or Dark Mode</FormFieldLabel>
        <ToggleButtonGroup
          onChange={onChangeToggleButton}
          value={settings.themeMode}
        >
          <ToggleButton value="light">Light</ToggleButton>
          <ToggleButton value="dark">Dark</ToggleButton>
        </ToggleButtonGroup>
      </FormField>
    </div>
  );
};
