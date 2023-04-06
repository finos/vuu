import React, {
  createContext,
  HTMLAttributes,
  ReactNode,
  useContext,
  ReactElement,
} from "react";
import cx from "classnames";

export const DEFAULT_DENSITY:Density = "medium";
export const DEFAULT_THEME:Theme = "salt-theme";
export const DEFAULT_THEME_MODE:ThemeMode = "light";

export type Density = "high" | "medium" | "low" | "touch";
export type Theme = "salt-theme";
export type ThemeMode = "light" | "dark";
type TargetElement = "root" | "scope" | "child";

export interface ThemeContextProps {
  density?: Density;
  theme?: Theme;
  themeMode?: ThemeMode;
}

export const ThemeContext = createContext<ThemeContextProps>({
  density: "medium",
  theme: "salt-theme",
  themeMode: "light"
});

const createThemedChildren = (
  children: ReactNode,
  theme: Theme,
  density: Density,
  // themeMode: ThemeMode
) => {
  if (React.isValidElement<HTMLAttributes<HTMLElement>>(children)) {
    return React.cloneElement(children, {
      className: cx(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        children.props?.className,
        theme,
        `salt-density-${density}`
      )
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
  children: ReactElement;
  density?: Density;
  theme?: Theme;
  themeMode?: ThemeMode;
  applyClassesTo?: TargetElement;
}

export const ThemeProvider = ({
  children,
  density: densityProp,
  theme: themeProp,
  themeMode: themeModeProp
}: ThemeProviderProps) => {
  const { theme: inheritedTheme, density: inheritedDensity, themeMode: inheritedThemeMode } =
    useContext(ThemeContext);

  const density = densityProp ?? inheritedDensity ?? DEFAULT_DENSITY;
  const theme = themeProp ?? inheritedTheme ?? DEFAULT_THEME;
  const themeMode = themeModeProp ?? inheritedThemeMode ?? DEFAULT_THEME_MODE;

  const themedChildren = createThemedChildren(children, theme, density);

  return (
    <ThemeContext.Provider
      value={{ density, theme }}
      data-mode={themeMode}
    >
      {themedChildren}
    </ThemeContext.Provider>
  );
};
