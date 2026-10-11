import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import type { NavNodeData } from "../tree-nav/nav-tree";
import { PreviewBar } from "./PreviewBar";
import { PreviewCanvas } from "./PreviewCanvas";
import { usePreviewSource } from "./usePreviewSource";

import "./ExamplePage.css";

const classBase = "ShowcaseExamplePage";

export const isDataConsumer = (nodeData?: NavNodeData) =>
  nodeData?.tags?.includes("data-consumer") ?? false;

export interface ExamplePageProps {
  treeNode: TreeSourceNode<NavNodeData>;
}

export const ExamplePage = ({ treeNode }: ExamplePageProps) => {
  const { preview, reload, reloadKey, src } = usePreviewSource();
  return (
    <div className={classBase}>
      <PreviewBar
        dataConsumer={isDataConsumer(treeNode.nodeData)}
        onReload={reload}
        standaloneHref={src}
        viewportControls
      />
      <PreviewCanvas
        density={preview.density}
        key={reloadKey}
        src={src}
        title={treeNode.label}
        viewport={preview.vp}
      />
    </div>
  );
};
