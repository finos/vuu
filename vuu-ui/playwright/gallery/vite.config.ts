import react from "@vitejs/plugin-react";
import MagicString from "magic-string";
import { createFilter, defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

function inlinePackageCss() {
  const filter = createFilter("**/packages/**/*.{tsx,jsx}");

  return {
    name: "inline-package-css",
    enforce: "pre" as const,
    transform(source: string, id: string) {
      if (!filter(id)) {
        return;
      }

      const code = new MagicString(source).replaceAll('.css";', '.css?inline";');
      return {
        code: code.toString(),
        map: code.generateMap({ hires: true, source: id }),
      };
    },
  };
}

export default defineConfig({
  publicDir: false,
  plugins: [react(), tsconfigPaths(), inlinePackageCss()],
  server: {
    port: 3100,
  },
});
