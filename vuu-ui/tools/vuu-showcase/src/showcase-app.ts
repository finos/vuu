import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import start from "./root";
import type { ShowcaseNodeData } from "../scripts/showcase-examples";

declare const __SHOWCASE_TREE_SOURCE__: TreeSourceNode<ShowcaseNodeData>[];

start(__SHOWCASE_TREE_SOURCE__);
