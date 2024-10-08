import fs from "fs";
import path from "path";

export function readJson(path) {
  const rawdata = fs.readFileSync(path);
  const json = JSON.parse(rawdata.toString());
  return json;
}

export function createFolder(folderPath) {
  fs.mkdirSync(folderPath, { recursive: true });
}

export const writeFile = async (text, path) =>
  new Promise((resolve, reject) => {
    fs.writeFile(path, text, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(undefined);
      }
    });
  });

export const copyFiles = (from: string, to: string) => {
  fs.readdirSync(from).forEach((element) => {
    if (fs.lstatSync(path.join(from, element)).isFile()) {
      fs.copyFileSync(path.join(from, element), path.join(to, element));
    } else {
      throw Error("not expecing to find a folder");
    }
  });
};
