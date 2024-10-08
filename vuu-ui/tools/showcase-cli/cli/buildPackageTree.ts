import fs from "fs";
import path from "path";

const OUT = "./src/generated/stories.json";

export const buildPackageTree = (dir: string, tree = {}) => {
  fs.readdirSync(dir).forEach((fileName) => {
    const filePath = path.join(dir, fileName);
    if (fs.lstatSync(filePath).isDirectory()) {
      const subTree = buildPackageTree(filePath);
      if (Object.keys(subTree).length > 0) {
        tree[fileName] = buildPackageTree(filePath);
      }
    } else if (fileName.match(/(examples.tsx|.mdx)$/)) {
      const [storyName] = fileName.split(".");
      tree[storyName] = `${dir}${fileName}`;
    }
  });
  return tree;
};
