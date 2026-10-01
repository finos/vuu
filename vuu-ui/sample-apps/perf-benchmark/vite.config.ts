import react from "@vitejs/plugin-react";
import { createFilter, defineConfig, type Plugin } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import MagicString from "magic-string";

// A handful of @vuu-ui components (e.g. ColumnExpressionInput) import their
// CSS as a default export (`import css from "./Foo.css"`) rather than as a
// side-effecting import, which plain Vite/Rollup can't resolve. Same fix as
// playwright-ct.config.ts: rewrite those imports to `?inline` so Vite treats
// the CSS as a string import instead.
function cssInline(): Plugin {
  const filter = createFilter(["**/packages/**/*.{tsx,jsx}"], ["**/**.stories.tsx"]);
  return {
    name: "vite-plugin-inline-css",
    enforce: "pre",
    transform(src, id) {
      if (filter(id)) {
        const s = new MagicString(src);
        s.replaceAll('.css";', '.css?inline";');
        return { code: s.toString(), map: s.generateMap({ hires: true, source: id }) };
      }
    },
  };
}

// Workspace @vuu-ui/* packages publish "main": "src/index.ts" (raw source,
// no per-package build during dev). vite-tsconfig-paths resolves through
// the npm workspace symlinks to that source, matching the approach already
// used by playwright-ct.config.ts for component tests.
export default defineConfig({
  plugins: [react(), tsconfigPaths(), cssInline()],
  resolve: {
    mainFields: ["module", "main"],
  },
  server: {
    port: 4173,
  },
});
