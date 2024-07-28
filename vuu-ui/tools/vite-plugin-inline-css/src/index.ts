import type { Plugin } from "vite";
import { createFilter } from "vite";
import MagicString from "magic-string";

export interface Options {
  /** Glob patterns to ignore */
  exclude?: string[];
  /** Glob patterns to include. defaults to ts|tsx */
  include?: string[];
}

// This plugin adds "?inline" to each css import within our components to disable
// vite's own style injection used in storybook
export function cssInline(options: Options = {}): Plugin {
  const {
    exclude = ["**/**.stories.tsx"],
    include = [
      "**/packages/vuu-datatable/**/*.{tsx,jsx}",
      "**/packages/vuu-data-react/**/*.{tsx,jsx}",
      "**/packages/vuu-filters/**/*.{tsx,jsx}",
      "**/packages/vuu-layout/**/*.{tsx,jsx}",
      "**/packages/vuu-popups/**/*.{tsx,jsx}",
      "**/packages/vuu-shell/**/*.{tsx,jsx}",
      "**/packages/vuu-table/**/*.{tsx,jsx}",
      "**/packages/vuu-table-extras/**/*.{tsx,jsx}",
      "**/packages/vuu-ui-controls/**/*.{tsx,jsx}",
    ],
  } = options;
  const filter = createFilter(include, exclude);

  return {
    name: "css-inline-plugin",
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
