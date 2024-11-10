import type { Module, TreeSourceNode } from "@finos/vuu-utils";
import { ExhibitsJson } from "./buildPackageTree";

export type VuuExample = {
  (props?: any): JSX.Element;
  displaySequence: number;
};

export type ExamplesModule = Module<VuuExample>;

const getFileType = (filePath: string) => {
  const pos = filePath.lastIndexOf(".");
  if (pos === -1) {
    throw Error(`file path ${filePath} has no file type suffix`);
  }
  return filePath.slice(pos + 1);
};

export const treeSourceFromFileSystem = (
  exhibits: ExhibitsJson,
  prefix = "",
  icon = "folder",
): TreeSourceNode[] => {
  const entries = Object.entries(exhibits);
  return entries.map<TreeSourceNode>(([label, nestedExhibits]) => {
    const id = `${prefix}${label}`;
    // TODO how can we know when a potential docs node has docs
    // console.log(`id=${id}`);
    if (typeof nestedExhibits === "string") {
      const fileType = getFileType(nestedExhibits);
      return {
        fileType,
        id,
        icon: "rings",
        label,
        loaded: false,
      };
    }
    return {
      id,
      icon,
      label,
      childNodes: treeSourceFromFileSystem(nestedExhibits, `${id}/`, "box"),
    };
  });
};
