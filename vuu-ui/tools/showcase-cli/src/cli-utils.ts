import fs from "fs";

export function readJson(path) {
  const rawdata = fs.readFileSync(path);
  const json = JSON.parse(rawdata.toString());
  return json;
}
