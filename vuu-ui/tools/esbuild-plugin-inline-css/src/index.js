import { transform } from "esbuild";
import { readFile } from "fs/promises";

export default function CssInlinePlugin() {
  return {
    name: "InlineCSSPlugin",
    setup(build) {
      build.onLoad({ filter: /\.css$/ }, async (args) => {
        console.log(`path ${args.path}`);
        const f = await readFile(args.path);
        const css = await transform(f, { loader: "css", minify: true });
        return { loader: "text", contents: css.code };
      });
    },
  };
}
