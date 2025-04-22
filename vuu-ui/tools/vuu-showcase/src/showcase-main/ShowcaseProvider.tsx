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

export interface ShowcaseContextProps {
  density: Density;
  onChangeDensity: (density: Density) => void;
  onChangeTheme: (theme: string) => void;
  onChangeThemeMode: (themeMode: ThemeMode) => void;
  theme: string;
  themeMode: ThemeMode;
}

export const ShowcaseContext = createContext<ShowcaseContextProps>({
  density: "high",
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
}

export const ShowcaseProvider = ({ children }: ShowcaseProviderProps) => {
  const [density, setDensity] = useState<Density>("high");
  const [theme, setTheme] = useState<string>("vuu-theme");
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");

  const [onChangeDensity, onChangeTheme, onChangeThemeMode] = useMemo(() => {
    return [setDensity, setTheme, setThemeMode];
  }, []);

  return (
    <ShowcaseContext.Provider
      value={{
        density,
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
