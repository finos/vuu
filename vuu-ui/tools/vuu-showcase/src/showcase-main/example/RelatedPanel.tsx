import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import { ChromeIcon } from "../chrome/ChromeIcon";
import { RouteLink } from "../chrome/RouteLink";
import type { NavNodeData } from "../tree-nav/nav-tree";
import { routeOf } from "./example-model";

import "./RelatedPanel.css";

type NavNode = TreeSourceNode<NavNodeData>;

const classBase = "ShowcaseRelated";

const RelatedCard = ({
  kind,
  node,
}: {
  kind: "doc" | "example";
  node: NavNode;
}) => (
  <RouteLink className={`${classBase}-card`} path={routeOf(node)}>
    <span className={`${classBase}-cardTitle`}>
      <ChromeIcon name={kind === "doc" ? "docs" : "code"} size={14} />
      {node.label}
      {node.nodeData?.live ? (
        <span className={`${classBase}-live`} title="Live data">
          <ChromeIcon name="bolt" size={12} />
        </span>
      ) : null}
    </span>
    {node.nodeData?.description ? (
      <span className={`${classBase}-cardDescription`}>
        {node.nodeData.description}
      </span>
    ) : null}
  </RouteLink>
);

export interface RelatedPanelProps {
  docs: NavNode[];
  fileLabel?: string;
  siblings: NavNode[];
}

export const RelatedPanel = ({
  docs,
  fileLabel,
  siblings,
}: RelatedPanelProps) => (
  <div className={classBase}>
    {docs.length ? (
      <section className={`${classBase}-section`}>
        <h2 className={`${classBase}-heading`}>Used in docs</h2>
        <div className={`${classBase}-grid`}>
          {docs.map((node) => (
            <RelatedCard key={node.id} kind="doc" node={node} />
          ))}
        </div>
      </section>
    ) : null}
    {siblings.length ? (
      <section className={`${classBase}-section`}>
        <h2 className={`${classBase}-heading`}>
          More from {fileLabel ?? "this file"}
          <span className={`${classBase}-count`}>{siblings.length}</span>
        </h2>
        <div className={`${classBase}-grid`}>
          {siblings.map((node) => (
            <RelatedCard key={node.id} kind="example" node={node} />
          ))}
        </div>
      </section>
    ) : null}
  </div>
);
