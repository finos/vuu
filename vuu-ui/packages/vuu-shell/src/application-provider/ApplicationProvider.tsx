import {
  type Accent,
  type Density,
  type Mode,
  SaltProviderNext,
  type ThemeContextProps,
  useDensity,
  useTheme,
} from "@salt-ds/core";
import {
  type ReactElement,
  type ReactNode,
  useContext,
} from "react";
import {
  ApplicationContext,
  type ApplicationContextProps,
} from "./ApplicationContext";

export interface ApplicationProviderProps
  extends Partial<Pick<ThemeContextProps, "theme" | "mode">>,
  Partial<ApplicationContextProps> {
  children: ReactNode;
  density?: Density;
}

const accentPurple = "purple" as Accent;

const getThemeMode = (
  mode: Mode = "light",
) => {
  if (mode === "light" || mode === "dark") {
    return mode;
  }
  return mode;
};

export const ApplicationProvider = ({
  children,
  density: densityProp,
  logout,
  mode,
  theme,
}: ApplicationProviderProps): ReactElement | null => {
  const { mode: inheritedMode, theme: inheritedTheme } = useTheme();
  const density = useDensity(densityProp);
  const context = useContext(ApplicationContext);


  return (
    <ApplicationContext.Provider
      value={{
        ...context,
        logout,
      }}
    >
      <SaltProviderNext
        accent={accentPurple}
        corner="rounded"
        theme={theme ?? inheritedTheme ?? "vuu-theme"}
        density={density}
        mode={getThemeMode(mode ?? inheritedMode)}
      >
        {children}
      </SaltProviderNext>
    </ApplicationContext.Provider>
  )
};


