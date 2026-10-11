import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import { IFrame } from "../iframe";
import type { NavNodeData } from "../tree-nav/nav-tree";
import { isDataConsumer } from "./ExamplePage";
import { PreviewBar } from "./PreviewBar";
import { usePreviewSource } from "./usePreviewSource";

import "./ExamplePage.css";

export interface DocumentPageProps {
  treeNode?: TreeSourceNode<NavNodeData>;
}

/** An mdx document, rendered in the iframe, below the preview controls */
export const DocumentPage = ({ treeNode }: DocumentPageProps) => {
  const { reload, reloadKey, src } = usePreviewSource();
  return (
    <div className="ShowcaseDocumentPage">
      <PreviewBar
        dataConsumer={isDataConsumer(treeNode?.nodeData)}
        onReload={reload}
        standaloneHref={src}
      />
      <div className="ShowcaseDocumentPage-frame">
        <IFrame key={reloadKey} src={src} title={treeNode?.label ?? "Document"} />
      </div>
    </div>
  );
};
