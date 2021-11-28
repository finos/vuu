import { ThemeProvider } from '@vuu-ui/theme';

import './global.css';

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' }
};

export const globalTypes = {
  theme: {
    name: 'Theme',
    description: 'Global theme for components',
    defaultValue: 'hw-light',
    toolbar: {
      // Storybook built in icons here - https://www.chromatic.com/component?appId=5a375b97f4b14f0020b0cda3&name=Basics%2FIcon&buildNumber=20654
      icon: 'mirror',
      items: ['hw-light', 'hw-dark']
    }
  },
  density: {
    name: 'Density',
    description: 'Global density for components',
    defaultValue: 'medium',
    toolbar: {
      // Storybook built in icons here - https://www.chromatic.com/component?appId=5a375b97f4b14f0020b0cda3&name=Basics%2FIcon&buildNumber=20654
      icon: 'graphbar',
      items: ['touch', 'low', 'medium', 'high']
    }
  }
};

const withThemeProvider = (Story, context) => {
  const theme = context.globals.theme;
  const density = context.globals.density;
  return (
    <ThemeProvider theme={theme} density={density}>
      <Story {...context} />
    </ThemeProvider>
  );
};

export const decorators = [withThemeProvider];
