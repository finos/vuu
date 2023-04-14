import React, {
  createContext,
  HTMLAttributes,
  ReactNode,
  ReactElement,
  useState,
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
  setDensity: React.Dispatch<React.SetStateAction<Density>>;
  theme?: Theme;
  themeMode?: ThemeMode;
  setThemeMode: React.Dispatch<React.SetStateAction<ThemeMode>>;
}

export const ThemeContext = createContext<ThemeContextProps>({
  // density: "high",
  // theme: "salt-theme",
  // themeMode: "light",
  // onThemeChange: () => undefined,
  // onDensityChange: () => undefined
  setDensity: () => undefined,
  setThemeMode: () => undefined
});

const createThemedChildren = (
  children: ReactNode,
  theme: Theme,
  density: Density,
) => {
  console.log(children);
  if (React.isValidElement<HTMLAttributes<HTMLElement>>(children)) {
    return React.cloneElement(children, {
      className: cx(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        children.props?.className,
        theme,
        `salt-density-${density}`,
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
  children?: ReactElement;
  density?: Density;
  // setDensity?: React.Dispatch<React.SetStateAction<Density>>;
  // theme?: Theme;
  themeMode?: ThemeMode;
  // setThemeMode?: React.Dispatch<React.SetStateAction<ThemeMode>>;
  applyClassesTo?: TargetElement;
}

export const ThemeProvider = ({
  children,
  // density: densityProp,
  // theme: themeProp,
  // themeMode: themeModeProp
}: ThemeProviderProps) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const [density, setDensity] = useState<Density>("medium");
  // const { theme: inheritedTheme, density: inheritedDensity, themeMode: inheritedThemeMode} =
  //   useContext(ThemeContext);
  
  // console.log(densityProp, themeProp, themeModeProp);

  // const density = densityProp ?? inheritedDensity ?? DEFAULT_DENSITY;
  // const theme = themeProp ?? inheritedTheme ?? DEFAULT_THEME;
  // const themeMode = themeModeProp ?? inheritedThemeMode ?? DEFAULT_THEME_MODE;

  const themedChildren = createThemedChildren(children, "salt-theme", density);

  return (
    <div className={`salt-theme salt-density-${density}`} data-mode={themeMode}>
      <ThemeContext.Provider
        value={{ density, themeMode, setThemeMode, setDensity }}
        // data-mode={themeMode}
        // handleChange={handleChange}
      >
        {themedChildren}
      </ThemeContext.Provider>
    </div>
  );
};
