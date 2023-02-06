import React, {
  createContext,
  HTMLAttributes,
  ReactNode,
  useContext,
  ReactElement,
} from "react";
import cx from "classnames";

export const DEFAULT_DENSITY = "medium";
export const DEFAULT_THEME = "salt-theme";

export type Density = "high" | "medium" | "low" | "touch";

export interface ThemeContextProps {
  density?: Density;
  themes?: string[];
  theme?: string;
}

export const ThemeContext = createContext<ThemeContextProps>({
  density: undefined,
  themes: ["salt-theme"],
  theme: "salt-theme",
});

const createThemedChildren = (
  children: ReactNode,
  theme: string,
  density: Density
) => {
  if (React.isValidElement<HTMLAttributes<HTMLElement>>(children)) {
    return React.cloneElement(children, {
      className: cx(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        children.props?.className,
        theme,
        `salt-density-${density}`
      ),
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
  applyClassesToChild?: true;
}

export const ThemeProvider = ({
  children,
  density: densityProp,
  theme: themeProp,
}: ThemeProviderProps) => {
  const { theme: inheritedTheme, density: inheritedDensity } =
    useContext(ThemeContext);

  const density = densityProp ?? inheritedDensity ?? DEFAULT_DENSITY;
  const theme = themeProp ?? inheritedTheme ?? DEFAULT_THEME;

  const themedChildren = createThemedChildren(children, theme, density);

  return (
    <ThemeContext.Provider value={{ density, theme }}>
      {themedChildren}
    </ThemeContext.Provider>
  );
};
