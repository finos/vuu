import { VuuRowDataItemType } from "@finos/vuu-protocol-types";
import { SaltProvider } from "@salt-ds/core";
import {
  ReactElement,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  ApplicationContext,
  ApplicationContextProps,
} from "./ApplicationContext";
import { usePersistenceManager } from "../persistence-management";

export interface ApplicationProviderProps
  extends Partial<Omit<ApplicationContextProps, "userSettings">> {
  children: ReactNode;
}

const getThemeMode = (
  userSettings?: Record<string, string | number | boolean>
) => {
  const themeMode = userSettings?.themeMode;
  if (themeMode === "light" || themeMode === "dark") {
    return themeMode;
  }
  return "light";
};

export const ApplicationProvider = ({
  children,
  userSettingsSchema: userSettingsSchema,
  user,
}: ApplicationProviderProps): ReactElement | null => {
  const persistenceManager = usePersistenceManager();
  const context = useContext(ApplicationContext);
  const [userSettings, setSettings] =
    useState<Record<string, string | number | boolean>>();

  useMemo(async () => {
    if (persistenceManager) {
      const userSettings = await persistenceManager.getUserSettings();
      setSettings(userSettings);
    } else {
      setSettings({});
    }
  }, [persistenceManager]);

  const onUserSettingChanged = useCallback(
    (propertyName: string, value: VuuRowDataItemType) => {
      setSettings((currentSettings) => {
        const newSettings = { ...currentSettings, [propertyName]: value };
        persistenceManager?.saveUserSettings(newSettings);
        return newSettings;
      });
    },
    [persistenceManager]
  );

  return userSettings ? (
    <ApplicationContext.Provider
      value={{
        ...context,
        onUserSettingChanged,
        userSettings,
        userSettingsSchema,
        user: user ?? context.user,
      }}
    >
      <SaltProvider
        theme="vuu-theme"
        density="high"
        mode={getThemeMode(userSettings)}
      >
        {children}
      </SaltProvider>
    </ApplicationContext.Provider>
  ) : null;
};

export const useApplicationUser = () => {
  const { user } = useContext(ApplicationContext);
  return user;
};

//Setter method (only used within the shell)
export const useApplicationSettings = () => {
  const { onUserSettingChanged, userSettings, userSettingsSchema } =
    useContext(ApplicationContext);
  return {
    onUserSettingChanged,
    userSettings,
    userSettingsSchema,
  };
};

//Getter method (read only access to applicationSetting)
export const useUserSetting = () => {
  const { userSettings } = useContext(ApplicationContext);
  return { userSettings };
};
