import React, {
  createContext,
  HTMLAttributes,
  ReactNode,
  isValidElement,
  cloneElement,
  useContext,
} from "react";
import cx from "classnames";

export const DEFAULT_DENSITY: Density = "medium";
export const DEFAULT_THEME = "salt-theme";
export const DEFAULT_THEME_MODE: ThemeMode = "light";

export type Density = "high" | "medium" | "low" | "touch";
export type ThemeMode = "light" | "dark";
export type TargetElement = "root" | "scope" | "child";

export interface ThemeContextProps {
  density: Density;
  theme: string;
  themeMode: ThemeMode;
}

export const ThemeContext = createContext<ThemeContextProps>({
  density: "high",
  theme: "vuu",
  themeMode: "light",
});

export type ThemeClasses = [string, string, ThemeMode];

const DEFAULT_THEME_ATTRIBUTES: ThemeClasses = [
  "vuu",
  "vuu-density-high",
  "light" as ThemeMode,
];

export type ThemeAttributes = {
  themeClass: string;
  densityClass: string;
  dataMode: ThemeMode;
};

export const useThemeAttributes = (
  themeAttributes?: ThemeAttributes
): [string, string, ThemeMode] => {
  const context = useContext(ThemeContext);
  if (themeAttributes) {
    return [
      themeAttributes.themeClass,
      themeAttributes.densityClass,
      themeAttributes.dataMode,
    ];
  } else if (context) {
    return [
      `${context.theme}-theme`,
      `${context.theme}-density-${context.density}`,
      context.themeMode,
    ];
  }
  return DEFAULT_THEME_ATTRIBUTES;
};

const createThemedChildren = (
  children: ReactNode,
  theme: string,
  themeMode: ThemeMode,
  density: Density
) => {
  if (isValidElement<HTMLAttributes<HTMLElement>>(children)) {
    return cloneElement(children, {
      className: cx(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        children.props?.className,
        `${theme}-theme`,
        `${theme}-density-${density}`
      ),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      "data-mode": themeMode,
    });
  } else {
    console.warn(
      `\nThemeProvider can only apply CSS classes for theming to a single nested child element of the ThemeProvider.
          Wrap elements with a single container`
    );
    return children;
  }
};

interface ThemeProviderProps {
  applyThemeClasses?: boolean;
  children: ReactNode;
  density?: Density;
  theme?: string;
  themeMode?: ThemeMode;
}

export const ThemeProvider = ({
  applyThemeClasses = false,
  children,
  theme: themeProp,
  themeMode: themeModeProp,
  density: densityProp,
}: ThemeProviderProps) => {
  const {
    density: inheritedDensity,
    themeMode: inheritedThemeMode,
    theme: inheritedTheme,
  } = useContext(ThemeContext);
  const density = densityProp ?? inheritedDensity ?? DEFAULT_DENSITY;
  const themeMode = themeModeProp ?? inheritedThemeMode ?? DEFAULT_THEME_MODE;
  const theme = themeProp ?? inheritedTheme ?? DEFAULT_THEME;
  const themedChildren = applyThemeClasses
    ? createThemedChildren(children, theme, themeMode, density)
    : children;

  return (
    <ThemeContext.Provider value={{ themeMode, density, theme }}>
      {themedChildren}
    </ThemeContext.Provider>
  );
};

ThemeProvider.displayName = "ThemeProvider";
