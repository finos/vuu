import { TreeSourceNode } from "@finos/vuu-ui-controls";
import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppProps } from "./App";
import { ExhibitsJson } from "./exhibit-utils";

const sourceFromImports = (
  exhibits: ExhibitsJson,
  prefix = "",
  icon = "folder",
): TreeSourceNode[] =>
  Object.entries(exhibits).map<TreeSourceNode>(([label, exhibits]) => {
    const id = `${prefix}${label}`;
    if (typeof exhibits === "string") {
      return {
        id,
        icon: "rings",
        label,
      };
    }
    return {
      id,
      icon,
      label,
      childNodes: sourceFromImports(exhibits, `${id}/`, "box"),
    };
  });

const getTargetExhibit = (exhibits: ExhibitsJson, path: string) => {
  const steps = path.split("/");
  const root = steps.slice(0, -1).join("/");

  let node: string | ExhibitsJson = exhibits;
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

export const useShowcaseApp = ({ exhibits }: AppProps) => {
  const navigate = useNavigate();

  const source = useMemo(() => sourceFromImports(exhibits), [exhibits]);

  const handleChange = async ([selected]: TreeSourceNode[]) => {
    console.log(JSON.stringify(selected, null, 2));

    const sourceTarget = getTargetExhibit(exhibits, selected.id);
    if (sourceTarget?.endsWith(".tsx")) {
      const module = await import(
        /* @vite-ignore */
        `exhibits:src/examples/${sourceTarget}`
      );
      console.log(module);
    }
    // navigate(selected.id);
  };

  return {
    onSelectionChange: handleChange,
    source,
  };
};
