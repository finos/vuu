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

export interface ApplicationProviderProps
  extends Partial<ApplicationContextProps> {
  children: ReactNode;
}

export const ApplicationProvider = ({
  children,
  settings: settingsProp,
  user,
}: ApplicationProviderProps): ReactElement => {
  const context = useContext(ApplicationContext);
  const [settings, setSettings] = useState(settingsProp ?? context.settings);

  const changeSetting = useCallback((propertyName: string, value: unknown) => {
    setSettings((s) => ({ ...s, [propertyName]: value }));
  }, []);

  return (
    <ApplicationContext.Provider
      value={{
        ...context,
        changeSetting,
        settings,
        user: user ?? context.user,
      }}
    >
      <SaltProvider theme="vuu-theme" density="high" mode={settings.themeMode}>
        {children}
      </SaltProvider>
    </ApplicationContext.Provider>
  );
};

export const useApplicationUser = () => {
  const { user } = useContext(ApplicationContext);
  return user;
};

export const useApplicationSettings = () => {
  const { changeSetting, settings } = useContext(ApplicationContext);
  return { changeSetting, settings };
};
