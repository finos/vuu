import { createFilter } from "vite";
import MagicString from "magic-string";
/**
 * This plugin is invoked when we run showcase in dev mode
 */
// This plugin adds "?inline" to each css import within our components to disable
// vite's own style injection used in storybook
export function cssInline() {
  const exclude = ["**/**.stories.tsx"];
  const include = [
    "**/packages/grid-layout/**/*.{tsx,jsx}",
    "**/packages/vuu-datatable/**/*.{tsx,jsx}",
    "**/packages/vuu-data-react/**/*.{tsx,jsx}",
    "**/packages/vuu-filters/**/*.{tsx,jsx}",
    "**/packages/vuu-layout/**/*.{tsx,jsx}",
    "**/packages/vuu-notifications/**/*.{tsx,jsx}",
    "**/packages/vuu-popups/**/*.{tsx,jsx}",
    "**/packages/vuu-shell/**/*.{tsx,jsx}",
    "**/packages/vuu-table/**/*.{tsx,jsx}",
    "**/packages/vuu-table-extras/**/*.{tsx,jsx}",
    "**/packages/vuu-ui-controls/**/*.{tsx,jsx}",
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
