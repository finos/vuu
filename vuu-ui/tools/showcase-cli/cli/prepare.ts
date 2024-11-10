import fs from "fs";
import { buildPackageTree, ExhibitsJson } from "./buildPackageTree.ts";
import { writeFile } from "./cli-utils.ts";
import { treeSourceFromFileSystem } from "./treeSourceFromFileSystem.ts";
import { TreeSourceNode } from "@finos/vuu-utils";

export default async (config): Promise<[ExhibitsJson, TreeSourceNode[]]> => {
  console.log("prepare");

  //TODO use type validator to check config file
  const { exhibitsPath } = config;
  if (!fs.existsSync(exhibitsPath)) {
    console.log(
      "Error: Exhibits location doesn't exist. Given: ",
      exhibitsPath,
    );
    process.exit();
  }

  const exhibits = buildPackageTree(exhibitsPath);
  const treeSource = treeSourceFromFileSystem(exhibits);

  return [exhibits, treeSource];
};
