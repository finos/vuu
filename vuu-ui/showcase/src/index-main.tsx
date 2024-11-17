import ReactDOM from "react-dom";
import { Showcase } from "@finos/vuu-showcase";
import { TreeSourceNode } from "@finos/vuu-utils";

export default async (treeSource: TreeSourceNode[]) => {
  console.log("Showcase index-main start", {
    treeSource,
  });

  const root = document.getElementById("root") as HTMLDivElement;
  ReactDOM.render(<Showcase treeSource={treeSource} />, root);
};
