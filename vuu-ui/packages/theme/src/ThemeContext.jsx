import React, { createContext, useContext, useRef } from 'react';
import cx from 'classnames';

export const ThemeContext = createContext();

const lightTheme = {
  id: 'hw-light'
};

const darkTheme = {
  id: 'hw-dark'
};

const availableThemes = {
  'hw-light': lightTheme,
  'hw-dark': darkTheme
};

export function ThemeProvider({
  children,
  density = 'medium',
  theme: themeId = 'hw-light',
  themeLoader = null
}) {
  const currentTheme = useRef(themeId);
  if (themeId !== currentTheme.current) {
    currentTheme.current = themeId;
    themeLoader && themeLoader(themeId);
  }
  const theme = availableThemes[themeId];
  if (theme === undefined) {
    throw Error(`No registered theme ${themeId}`);
  }

  return (
    <ThemeContext.Provider value={{ density, theme }}>
      <hw-theme class={cx('hw', theme.id, `hw-density-${density}`)} style={{ display: 'contents' }}>
        {children}
      </hw-theme>
    </ThemeContext.Provider>
  );
}

export const { Consumer: ThemeConsumer } = ThemeContext;

export const useThemeProps = () => {
  // could just return the context, but not sure what else we might store
  const { density, theme } = useContext(ThemeContext);
  return { density, theme };
};
