import { ShowcaseStandalone } from "@finos/vuu-showcase";
import { TreeSourceNode } from "@finos/vuu-utils";
import ReactDOM from "react-dom";

export default async (treeSource: TreeSourceNode[]) => {
  console.log("Showcase index-standalone start", {
    treeSource,
  });
  const root = document.getElementById("root") as HTMLDivElement;

  ReactDOM.render(<ShowcaseStandalone />, root);
};
