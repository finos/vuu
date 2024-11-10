import type { TableRowSelectHandler } from "@finos/vuu-table-types";
import type { TreeSourceNode } from "@finos/vuu-utils";
import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { AppProps } from "./App";
import { ExhibitsJson } from "./exhibit-utils";
import { pathFromKey } from "./showcase-utils";

const getTargetExhibit = (source: TreeSourceNode[], path: string) => {
  const steps = path.split("/");
  const root = steps.slice(0, -1).join("/");

  let node: string | ExhibitsJson = source;
  let pathRoot: string[] = [];
  while (steps.length) {
    const step = steps.shift() as string;
    node = node[step];
  }
  if (typeof node === "string") {
    return `${root}/${node}`;
  } else {
    throw Error(`unexpected leaf node ${JSON.stringify(node)}`);
  }
};

export const useShowcaseApp = ({ treeSource }: AppProps) => {
  const navigate = useNavigate();

  const source = useMemo(() => treeSource, [treeSource]);

  const handleChange = async ([selected]: TreeSourceNode[]) => {
    console.log(JSON.stringify(selected, null, 2));

    // const sourceTarget = getTargetExhibit(treeSource, selected.id);
    // if (sourceTarget?.endsWith(".tsx")) {
    // console.log(`need to resolve ${sourceTarget}`);
    // const module = await import(
    //   /* @vite-ignore */
    //   `exhibits:src/examples/${sourceTarget}`
    // );
    // console.log(module);
  };
  // navigate(selected.id);
  // };

  const handleSelect: TableRowSelectHandler = useCallback(async (row) => {
    if (row) {
      const path = pathFromKey(row.key);
      console.log(`selected Path ${path}`, {
        row,
      });
      //navigate(path);
    }
  }, []);

  return {
    onSelect: handleSelect,
    source,
  };
};
