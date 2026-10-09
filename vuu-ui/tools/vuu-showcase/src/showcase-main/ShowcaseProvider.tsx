import React, {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";

export const DEFAULT_DENSITY: Density = "medium";
export const DEFAULT_THEME = "salt-theme";
export const DEFAULT_THEME_MODE: ThemeMode = "light";

export type Density = "high" | "medium" | "low" | "touch";
export type ThemeMode = "light" | "dark";
export type TargetElement = "root" | "scope" | "child";
export type DataLocation = "local" | "remote";

export interface ShowcaseContextProps {
  dataConsumer: boolean;
  dataLocation: DataLocation;
  density: Density;
  onChangeDataLocation: (dataLocation: DataLocation) => void;
  onChangeDensity: (density: Density) => void;
  onChangeTheme: (theme: string) => void;
  onChangeThemeMode: (themeMode: ThemeMode) => void;
  theme: string;
  themeMode: ThemeMode;
}

export const ShowcaseContext = createContext<ShowcaseContextProps>({
  dataConsumer: false,
  dataLocation: "local",
  density: "high",
  onChangeDataLocation: () =>
    console.log("[ShowcaseContext] No data location change handler provided"),
  onChangeDensity: () =>
    console.log("[ShowcaseContext] No density change handler provided"),
  onChangeTheme: () =>
    console.log("[ShowcaseContext] No theme change handler provided"),
  onChangeThemeMode: () =>
    console.log("[ShowcaseContext] No themeMode change handler provided"),
  theme: "vuu-theme",
  themeMode: "light",
});

export const useShowcaseContext = () => {
  return useContext(ShowcaseContext);
};

export type ThemeClasses = [string, string, ThemeMode];

interface ShowcaseProviderProps {
  children: ReactNode;
  isDataConsumer?: boolean;
}

export const ShowcaseProvider = ({
  children,
  isDataConsumer = false,
}: ShowcaseProviderProps) => {
  const [dataLocation, setDataLocation] = useState<DataLocation>("local");
  const [density, setDensity] = useState<Density>("high");
  const [theme, setTheme] = useState<string>("vuu-theme");
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");

  const [
    onChangeDataLocation,
    onChangeDensity,
    onChangeTheme,
    onChangeThemeMode,
  ] = useMemo(() => {
    return [setDataLocation, setDensity, setTheme, setThemeMode];
  }, []);

  return (
    <ShowcaseContext.Provider
      value={{
        dataConsumer: isDataConsumer,
        dataLocation,
        density,
        onChangeDataLocation,
        onChangeDensity,
        onChangeTheme,
        onChangeThemeMode,
        theme,
        themeMode,
      }}
    >
      {children}
    </ShowcaseContext.Provider>
  );
};

ShowcaseProvider.displayName = "ShowcaseProvider";
