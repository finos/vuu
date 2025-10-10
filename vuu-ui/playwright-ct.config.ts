import { defineConfig, devices } from '@playwright/experimental-ct-react';
import { createFilter } from "vite";
import MagicString from "magic-string";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Path Resolution Strategy for Playwright Component Tests
 * 
 * We use vite-tsconfig-paths (same as Cypress) to resolve @vuu-ui/* imports.
 * It resolves through npm workspaces to each package's "main" field, which
 * points to source files (src/index.ts) rather than built files.
 * 
 * This approach:
 * - Matches the Cypress setup exactly
 * - Keeps path configuration isolated from the main tsconfig.json
 * - Prevents affecting published package type definitions
 * - Is cleaner than maintaining manual Vite aliases for all packages
 */

// Custom CSS inline plugin that targets all packages
function cssInline() {
  const exclude = ["**/**.stories.tsx"];
  const include = [
    "**/packages/**/*.{tsx,jsx}",
  ];

  const filter = createFilter(include, exclude);

  return {
    name: "vite-plugin-inline-css",
    enforce: "pre",
    transform(src, id) {
      if (filter(id)) {
        const s = new MagicString(src);
        s.replaceAll('.css";', '.css?inline";');
        return {
          code: s.toString(),
          map: s.generateMap({ hires: true, source: id }),
        };
      }
    },
  };
}

export default defineConfig({
  testDir: './packages/vuu-ui-controls/src/__tests__/__component__',
  testMatch: '**/*.playwright.test.tsx',
  snapshotDir: './__snapshots__',
  timeout: 10 * 1000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'blob' : 'list',
  use: {
    trace: 'on-first-retry',
    ctPort: 3100,
    ctViteConfig: {
      resolve: {
        extensions: ['.tsx', '.ts', '.jsx', '.js'],
        mainFields: ['module', 'main'],
        conditions: ['import', 'module', 'browser', 'default'],
      },
      plugins: [
        tsconfigPaths({ projects: [path.join(__dirname, 'playwright/tsconfig.json')] }),
        cssInline(), // Use the custom CSS inline plugin
      ],
      build: {
        rollupOptions: {
          external: [
            'packages/vuu-data-remote/src/DedicatedWorker.ts',
            'packages/vuu-data-remote/src/inlined-worker',
            'packages/vuu-data-remote/src/worker',
          ],
        },
      },
    },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
