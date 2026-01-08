import { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import {
  Density,
  Mode,
  SaltProvider,
  ThemeContextProps,
  useDensity,
  useTheme,
} from "@salt-ds/core";
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
import { usePersistenceManager } from "../persistence-manager";

export interface ApplicationProviderProps
  extends Partial<Pick<ThemeContextProps, "theme" | "mode">>,
    Partial<Omit<ApplicationContextProps, "userSettings">> {
  children: ReactNode;
  density?: Density;
}

const getThemeMode = (
  mode: Mode = "light",
  userSettings?: Record<string, string | number | boolean>,
) => {
  const themeMode = userSettings?.themeMode;
  if (themeMode === "light" || themeMode === "dark") {
    return themeMode;
  }
  return mode;
};

export const ApplicationProvider = ({
  children,
  density: densityProp,
  loginUrl,
  mode,
  theme,
  userSettingsSchema: userSettingsSchema,
  user,
}: ApplicationProviderProps): ReactElement | null => {
  const { mode: inheritedMode, theme: inheritedTheme } = useTheme();
  const density = useDensity(densityProp);
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
    [persistenceManager],
  );

  return userSettings ? (
    <ApplicationContext.Provider
      value={{
        ...context,
        loginUrl,
        onUserSettingChanged,
        userSettings,
        userSettingsSchema,
        user: user ?? context.user,
      }}
    >
      <SaltProvider
        theme={theme ?? inheritedTheme ?? "vuu-theme-deprecated"}
        density={density}
        mode={getThemeMode(mode ?? inheritedMode, userSettings)}
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

export const useLoginUrl = () => {
  const { loginUrl } = useContext(ApplicationContext);
  return loginUrl;
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
  return userSettings;
};
