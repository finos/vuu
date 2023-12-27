import { Tree } from "@finos/vuu-ui-controls";
import showcaseData from "./Tree.data";

let displaySequence = 1;

export const ShowcaseTree = () => {
  return <Tree source={showcaseData} />;
};
ShowcaseTree.displaySequence = displaySequence++;
