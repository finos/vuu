import { transform } from "esbuild";
import { readFile } from "fs/promises";

const regex = /\*\*\/packages\/\*\*\/(Tab*).css$/;

export default function CssInlinePlugin() {
  return {
    name: "InlineCSSPlugin",
    setup(build) {
      build.onLoad({ filter: regex }, async (args) => {
        console.log(`path ${args.path}`);
        const f = await readFile(args.path);
        const css = await transform(f, { loader: "css", minify: true });
        return { loader: "text", contents: css.code };
      });
    },
  };
}
