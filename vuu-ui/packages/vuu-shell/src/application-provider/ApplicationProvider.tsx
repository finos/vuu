import {
  ReactElement,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import {
  ApplicationContext,
  ApplicationContextProps,
} from "./ApplicationContext";
import { SaltProvider } from "@salt-ds/core";
import { VuuRowDataItemType } from "packages/vuu-protocol-types";

export interface ApplicationProviderProps
  extends Partial<ApplicationContextProps> {
  children: ReactNode;
}

const getThemeMode = (
  applicationSettings?: Record<string, string | number | boolean>
) => {
  const themeMode = applicationSettings?.themeMode;
  if (themeMode === "light" || themeMode === "dark") {
    return themeMode;
  }
  return "light";
};

export const ApplicationProvider = ({
  children,
  applicationSettings: settingsProp,
  applicationSettingsSchema,
  user,
}: ApplicationProviderProps): ReactElement => {
  const context = useContext(ApplicationContext);
  const [applicationSettings, setSettings] = useState<
    Record<string, string | number | boolean>
  >(settingsProp ?? {});

  const onApplicationSettingChanged = useCallback(
    (propertyName: string, value: VuuRowDataItemType) => {
      setSettings((s) => ({ ...s, [propertyName]: value }));
    },
    []
  );

  return (
    <ApplicationContext.Provider
      value={{
        ...context,
        onApplicationSettingChanged,
        applicationSettings,
        applicationSettingsSchema,
        user: user ?? context.user,
      }}
    >
      <SaltProvider
        theme="vuu-theme"
        density="high"
        mode={getThemeMode(applicationSettings)}
      >
        {children}
      </SaltProvider>
    </ApplicationContext.Provider>
  );
};

export const useApplicationUser = () => {
  const { user } = useContext(ApplicationContext);
  return user;
};

//Setter method (only used within the shell)
export const useApplicationSettings = () => {
  const {
    onApplicationSettingChanged,
    applicationSettings,
    applicationSettingsSchema,
  } = useContext(ApplicationContext);
  return {
    onApplicationSettingChanged,
    applicationSettings,
    applicationSettingsSchema,
  };
};

//Getter method (read only access to applicationSetting)
export const useApplicationSetting = () => {
  const { applicationSettings } = useContext(ApplicationContext);
  return { applicationSettings };
};
