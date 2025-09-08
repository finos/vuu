import { beforeMount, afterMount } from '@playwright/experimental-ct-react/hooks';
import React from 'react';

// Global setup for all component tests
beforeMount(async ({ hooksConfig }) => {
  // Add any global setup here if needed
  // For example, setting up providers, themes, etc.
});

afterMount(async ({ hooksConfig }) => {
  // Add any cleanup here if needed
});
