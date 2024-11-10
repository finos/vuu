import fs from "fs";
import path from "path";

export interface ExhibitsJson {
  [key: string]: string | ExhibitsJson;
}

export const buildPackageTree = (dir: string, tree = {}): ExhibitsJson => {
  fs.readdirSync(dir).forEach((fileName) => {
    const filePath = path.join(dir, fileName);
    if (fs.lstatSync(filePath).isDirectory()) {
      const subTree = buildPackageTree(filePath);
      if (Object.keys(subTree).length > 0) {
        tree[fileName] = buildPackageTree(filePath);
      }
    } else if (fileName.match(/(examples.tsx|.mdx)$/)) {
      const [storyName] = fileName.split(".");
      tree[storyName] = fileName;
    }
  });
  return tree;
};
