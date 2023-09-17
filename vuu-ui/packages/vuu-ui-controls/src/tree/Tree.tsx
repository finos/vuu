import { useForkRef, useIdMemo as useId } from "@salt-ds/core";
import cx from "classnames";
import {
  ForwardedRef,
  forwardRef,
  HTMLAttributes,
  MouseEvent,
  useRef,
} from "react";
import { closestListItemIndex } from "./list-dom-utils";
import { useItemsWithIds } from "./use-items-with-ids";
import {
  GroupSelection,
  groupSelectionEnabled,
  TreeNodeSelectionHandler,
  TreeSelection,
} from "./use-selection";
import { useViewportTracking } from "./use-viewport-tracking";
import { useTree } from "./useTree";

import "./Tree.css";

const classBase = "vuuTree";

type Indexer = {
  value: number;
};

export interface TreeSourceNode {
  id: string;
  icon?: string;
  header?: boolean;
  label: string;
  childNodes?: TreeSourceNode[];
}
export interface NormalisedTreeSourceNode extends TreeSourceNode {
  childNodes?: NormalisedTreeSourceNode[];
  count: number;
  expanded?: boolean;
  index: number;
  level: number;
}

export interface NonLeafNode extends NormalisedTreeSourceNode {
  childNodes: NormalisedTreeSourceNode[];
}

export const isExpanded = (
  node: NormalisedTreeSourceNode
): node is NonLeafNode => node.expanded === true;

export interface TreeNodeProps extends HTMLAttributes<HTMLLIElement> {
  idx?: number;
}

// eslint-disable-next-line no-unused-vars
export const TreeNode = ({ children, idx, ...props }: TreeNodeProps) => {
  return <li {...props}>{children}</li>;
};

export interface TreeProps extends HTMLAttributes<HTMLUListElement> {
  allowDragDrop?: boolean;
  defaultSelected?: any;
  groupSelection?: GroupSelection;
  onHighlight?: (index: number) => void;
  onSelectionChange: (selected: TreeSourceNode[]) => void;
  revealSelected?: boolean;
  selected?: string[];
  selection?: TreeSelection;
  source: TreeSourceNode[];
}

const Tree = forwardRef(function Tree(
  {
    allowDragDrop,
    className,
    defaultSelected,
    groupSelection = "none",
    id: idProp,
    onHighlight,
    onSelectionChange,
    revealSelected,
    selected: selectedProp,
    selection = "single",
    source,
    ...htmlAttributes
  }: TreeProps,
  forwardedRef: ForwardedRef<HTMLUListElement>
) {
  const id = useId(idProp);
  const rootRef = useRef<HTMLUListElement>(null);

  // returns the full source data
  const [, sourceWithIds, sourceItemById] = useItemsWithIds(source, id, {
    revealSelected: revealSelected
      ? selectedProp ?? defaultSelected ?? false
      : undefined,
  });

  const handleSelectionChange: TreeNodeSelectionHandler = (evt, selected) => {
    if (onSelectionChange) {
      const sourceItems = selected
        .map((id) => sourceItemById(id))
        .filter((sourceItem) => sourceItem !== undefined) as TreeSourceNode[];
      onSelectionChange(sourceItems);
    }
  };

  const {
    focusVisible,
    highlightedIdx,
    hiliteItemAtIndex,
    listProps,
    listItemHandlers,
    selected,
    visibleData,
  } = useTree({
    defaultSelected,
    groupSelection,
    onChange: handleSelectionChange,
    onHighlight,
    selected: selectedProp,
    selection,
    sourceWithIds,
  });

  // const isScrolling = useViewportTracking(root, highlightedIdx);
  useViewportTracking(rootRef, highlightedIdx);

  const defaultItemHandlers = {
    onMouseEnter: (evt: MouseEvent) => {
      // if (!isScrolling.current) {
      const targetEl = evt.target as HTMLElement;
      const idx = closestListItemIndex(targetEl);
      hiliteItemAtIndex(idx);
      // onMouseEnterListItem && onMouseEnterListItem(evt, idx);
      // }
    },
  };

  const propsCommonToAllListItems = {
    ...defaultItemHandlers,
    ...listItemHandlers,
    role: "treeitem",
  };
  const allowGroupSelect = groupSelectionEnabled(groupSelection);

  /**
   * Add a ListItem from source item
   */
  function addLeafNode(
    list: JSX.Element[],
    item: NormalisedTreeSourceNode,
    idx: Indexer
  ) {
    list.push(
      <TreeNode
        {...propsCommonToAllListItems}
        {...getListItemProps(item, idx, highlightedIdx, selected, focusVisible)}
      >
        {item.icon ? (
          <span className={`${classBase}Node-icon`} data-icon={item.icon} />
        ) : null}
        <span>{item.label}</span>
      </TreeNode>
    );
    idx.value += 1;
  }

  function addGroupNode(
    list: JSX.Element[],
    child: NormalisedTreeSourceNode,
    idx: Indexer,
    id: string,
    title: string
  ) {
    const { value: i } = idx;
    idx.value += 1;
    list.push(
      <TreeNode
        {...listItemHandlers}
        aria-expanded={child.expanded}
        aria-level={child.level}
        aria-selected={selected.includes(id) || undefined}
        className={cx(`${classBase}Node`, {
          focusVisible: focusVisible === i,
          [`${classBase}Node-toggle`]: !allowGroupSelect,
        })}
        data-idx={i}
        data-highlighted={i === highlightedIdx || undefined}
        data-selectable
        id={id}
        key={`header-${i}`}
      >
        {allowGroupSelect ? (
          <div className={`${classBase}Node-label`}>
            <span className={`${classBase}Node-toggle`} />
            {title}
          </div>
        ) : (
          <div className={`${classBase}Node-label`}>
            {child.icon ? (
              <span
                className={`${classBase}Node-icon`}
                data-icon={child.icon}
              />
            ) : null}
            <span>{title}</span>
          </div>
        )}
        <ul role="group">
          {isExpanded(child) ? renderSourceContent(child.childNodes, idx) : ""}
        </ul>
      </TreeNode>
    );
  }

  function renderSourceContent(
    items: NormalisedTreeSourceNode[],
    idx = { value: 0 }
  ) {
    if (items?.length > 0) {
      const listItems: JSX.Element[] = [];
      for (const item of items) {
        if (item.childNodes) {
          addGroupNode(listItems, item, idx, item.id, item.label);
        } else {
          addLeafNode(listItems, item, idx);
        }
      }
      return listItems;
    }
  }

  return (
    <ul
      {...htmlAttributes}
      {...listProps}
      className={cx(classBase, className)}
      id={`Tree-${id}`}
      ref={useForkRef<HTMLUListElement>(rootRef, forwardedRef)}
      role="tree"
      tabIndex={0}
    >
      {renderSourceContent(visibleData)}
    </ul>
  );
});

const getListItemProps = (
  item: NormalisedTreeSourceNode,
  idx: Indexer,
  highlightedIdx: number,
  selected: string[],
  focusVisible: number,
  className?: string
) => ({
  id: item.id,
  key: item.id,
  "aria-level": item.level,
  "aria-selected": selected.includes(item.id) || undefined,
  "data-idx": idx.value,
  "data-highlighted": idx.value === highlightedIdx || undefined,
  className: cx("vuuTreeNode", className, {
    focusVisible: focusVisible === idx.value,
  }),
});

Tree.displayName = "Tree";
export default Tree;
