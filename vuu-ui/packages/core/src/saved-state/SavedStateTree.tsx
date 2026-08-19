import {
  StatusIndicator,
  Tag,
  Text,
  Tooltip,
  Tree,
  TreeNode,
  TreeNodeTrigger,
} from "@salt-ds/core";
import type { SyntheticEvent } from "react";
import type { SavedStateNode } from "./saved-state-model";

const classBase = "vuuSavedStateTree";

export interface SavedStateTreeProps {
  "aria-label"?: string;
  expanded: string[];
  nodes: readonly SavedStateNode[];
  onExpandedChange: (event: SyntheticEvent, expanded: string[]) => void;
  onSelectionChange: (event: SyntheticEvent, selected: string[]) => void;
  /** Controlled selection, including fully-selected parents (§9.13). */
  selected: string[];
}

const NodeContent = ({ node }: { node: SavedStateNode }) => {
  const meta = (
    <Text as="span" className={`${classBase}-meta`} color="secondary">
      {node.meta}
    </Text>
  );
  return (
    <span className={`${classBase}-content`} data-kind={node.kind}>
      <span className={`${classBase}-labelGroup`}>
        <Text as="span" className={`${classBase}-label`}>
          {node.label}
        </Text>
        {node.detail ? (
          <Text as="span" className={`${classBase}-key`} color="secondary">
            {node.detail}
          </Text>
        ) : null}
        {node.open ? (
          <Tag bordered className={`${classBase}-openTag`}>
            Open
          </Tag>
        ) : null}
        {node.tag ? (
          node.tooltip && node.kind === "not-carried-forward" ? (
            <Tooltip content={node.tooltip}>
              <Tag bordered className={`${classBase}-tag`}>
                {node.tag}
              </Tag>
            </Tooltip>
          ) : (
            <Tag bordered className={`${classBase}-tag`}>
              {node.tag}
            </Tag>
          )
        ) : null}
        {node.unreadable ? (
          <span className={`${classBase}-unreadable`}>
            <StatusIndicator aria-hidden status="warning" />
            <Text as="span">Unreadable data</Text>
          </span>
        ) : null}
      </span>
      {node.tooltip && node.kind !== "not-carried-forward" ? (
        <Tooltip content={node.tooltip} placement="left">
          {meta}
        </Tooltip>
      ) : (
        meta
      )}
    </span>
  );
};

// A function, not a component: Tree builds its model from direct TreeNode
// children (§9.13).
const renderNode = (node: SavedStateNode) => (
  <TreeNode key={node.id} value={node.id}>
    <TreeNodeTrigger
      aria-label={node.accessibleName}
      className={`${classBase}-node ${classBase}-${node.kind}`}
    >
      <NodeContent node={node} />
    </TreeNodeTrigger>
    {node.children?.map(renderNode)}
  </TreeNode>
);

/** The Saved state selection tree (§9.3). */
export const SavedStateTree = ({
  "aria-label": ariaLabel = "Saved state",
  expanded,
  nodes,
  onExpandedChange,
  onSelectionChange,
  selected,
}: SavedStateTreeProps) => (
  <Tree
    aria-label={ariaLabel}
    className={classBase}
    expanded={expanded}
    multiselect
    onExpandedChange={onExpandedChange}
    onSelectionChange={onSelectionChange}
    selected={selected}
  >
    {nodes.map(renderNode)}
  </Tree>
);
