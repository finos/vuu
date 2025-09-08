import { beforeMount, afterMount } from '@playwright/experimental-ct-react/hooks';

// Global setup for all component tests
beforeMount(async ({ hooksConfig: _hooksConfig }) => {
  // Add any global setup here if needed
  // For example, setting up providers, themes, etc.
});

afterMount(async ({ hooksConfig: _hooksConfig }) => {
  // Add any cleanup here if needed
});
