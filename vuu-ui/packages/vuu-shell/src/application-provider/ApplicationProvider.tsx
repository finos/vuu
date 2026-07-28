import {
  type Accent,
  type Density,
  type Mode,
  SaltProviderNext,
  type ThemeContextProps,
  useDensity,
  useTheme,
} from "@salt-ds/core";
import type { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import {
  type ReactElement,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { usePersistenceManager } from "../persistence-manager";
import {
  ApplicationContext,
  type ApplicationContextProps,
} from "./ApplicationContext";

export interface ApplicationProviderProps
  extends Partial<Pick<ThemeContextProps, "theme" | "mode">>,
    Partial<Omit<ApplicationContextProps, "userSettings">> {
  children: ReactNode;
  density?: Density;
}

const accentPurple = "purple" as Accent;

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
  logout,
  mode,
  theme,
  userSettingsSchema: userSettingsSchema,
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
        logout,
        onUserSettingChanged,
        userSettings,
        userSettingsSchema,
      }}
    >
      <SaltProviderNext
        accent={accentPurple}
        corner="rounded"
        theme={theme ?? inheritedTheme ?? "vuu-theme"}
        density={density}
        mode={getThemeMode(mode ?? inheritedMode, userSettings)}
      >
        {children}
      </SaltProviderNext>
    </ApplicationContext.Provider>
  ) : null;
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
