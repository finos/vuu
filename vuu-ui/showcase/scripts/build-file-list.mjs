import fs from "fs";
import path from "path";

export const buildFileList = (rootDir, pattern) => {
  return collectFiles(rootDir, pattern);
};

function collectFiles(dir, pattern, files = []) {
  fs.readdirSync(dir).forEach((fileName) => {
    const filePath = path.join(dir, fileName);
    if (fs.lstatSync(filePath).isDirectory()) {
      collectFiles(filePath, pattern, files);
    } else if (fileName.match(pattern)) {
      files.push(`${dir}/${fileName}`);
    }
  });
  return files;
}
