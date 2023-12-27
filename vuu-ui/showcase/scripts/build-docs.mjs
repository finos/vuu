import esbuild from "esbuild";
import mdx from "@mdx-js/esbuild";
import fs from "fs";
import path from "path";

const targetDir = "./src/examples";

const build = async (path) => {
  await esbuild.build({
    entryPoints: [path],
    outfile: path.replace(".mdx", ".js"),
    format: "esm",
    plugins: [
      mdx({
        /* jsxImportSource: …, otherOptions… */
      }),
    ],
  });
};

const buildAll = async (paths) => {
  for (const path of paths) {
    await build(path);
  }
};

async function findAllMdxDocs(dir, results = []) {
  const rootPath = path.resolve(dir);
  fs.readdirSync(rootPath).forEach((element) => {
    const childPath = path.join(rootPath, element);
    if (fs.lstatSync(childPath).isDirectory()) {
      findAllMdxDocs(childPath, results);
    } else if (childPath.endsWith(".mdx")) {
      results.push(childPath);
    }
  });
  return results;
}

const mdxDocs = await findAllMdxDocs(targetDir);

export default async () => buildAll(mdxDocs);
