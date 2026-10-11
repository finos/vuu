import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import { useNavigate } from "react-router-dom";
import type { NavNodeData } from "../tree-nav/nav-tree";

import "./FolderIndex.css";

const classBase = "ShowcaseFolderIndex";

const countLabel = (count = 0) =>
  `${count} example${count === 1 ? "" : "s"}`;

export interface FolderIndexProps {
  treeNode: TreeSourceNode<NavNodeData>;
}

/**
 * Lists the contents of a folder, or of an examples file, that has no
 * document of its own.
 */
export const FolderIndex = ({ treeNode }: FolderIndexProps) => {
  const navigate = useNavigate();
  const { childNodes = [], label, nodeData } = treeNode;
  return (
    <div className={classBase}>
      <header className={`${classBase}-header`}>
        <h1 className={`${classBase}-title`}>{label}</h1>
        <span className={`${classBase}-count`}>
          {countLabel(nodeData?.count)}
        </span>
      </header>
      <ul className={`${classBase}-list`}>
        {childNodes.map(({ childNodes, id, label, nodeData }) => (
          <li key={id}>
            <a
              className={`${classBase}-item`}
              href={`/${id}`}
              onClick={(e) => {
                if (!e.metaKey && !e.ctrlKey && !e.shiftKey) {
                  e.preventDefault();
                  navigate(`/${id}`);
                }
              }}
            >
              <span className={`${classBase}-itemTitle`}>
                {label}
                {nodeData?.live ? (
                  <span
                    className={`${classBase}-live`}
                    title="Uses live data"
                  />
                ) : null}
              </span>
              {childNodes?.length ? (
                <span className={`${classBase}-itemCount`}>
                  {countLabel(nodeData?.count)}
                </span>
              ) : null}
              {nodeData?.description ? (
                <span className={`${classBase}-itemDescription`}>
                  {nodeData.description}
                </span>
              ) : null}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};
