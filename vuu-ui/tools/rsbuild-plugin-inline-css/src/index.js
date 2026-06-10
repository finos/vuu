import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const DEFAULT_INCLUDE = [
  "/packages/grid-layout/",
  "/packages/vuu-datatable/",
  "/packages/vuu-context-menu/",
  "/packages/vuu-data-react/",
  "/packages/vuu-filters/",
  "/packages/vuu-layout/",
  "/packages/vuu-notifications/",
  "/packages/vuu-popups/",
  "/packages/vuu-shell/",
  "/packages/vuu-chart/",
  "/packages/vuu-table/",
  "/packages/vuu-table-extras/",
  "/packages/vuu-ui-controls/",
];

const DEFAULT_EXCLUDE = [".stories.tsx"];

export function pluginCssInline(options = {}) {
  const { include = DEFAULT_INCLUDE, exclude = DEFAULT_EXCLUDE } = options;

  return {
    name: "rsbuild-plugin-inline-css",
    setup(api) {
      api.modifyBundlerChain((chain) => {
        chain.module
          .rule("inline-css")
          .test(/\.(?:[jt]sx?|mjs)$/)
          .enforce("pre")
          .exclude.add(/node_modules/)
          .end()
          .use("inline-css-loader")
          .loader(require.resolve("./loader.js"))
          .options({ include, exclude });
      });
    },
  };
}

export default pluginCssInline;
