import React, {
  createContext,
  HTMLAttributes,
  ReactNode,
  ReactElement,
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
  theme: "salt-theme",
  themeMode: "light",
});

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
        theme,
        `salt-density-${density}`
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
  children: ReactElement;
  density?: Density;
  theme?: string;
  themeMode?: ThemeMode;
  applyClassesTo?: TargetElement;
}

export const ThemeProvider = ({
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
  const themedChildren = createThemedChildren(
    children,
    theme,
    themeMode,
    density
  );

  return (
    <ThemeContext.Provider value={{ themeMode, density, theme }}>
      {themedChildren}
    </ThemeContext.Provider>
  );
};

ThemeProvider.displayName = "ThemeProvider";
