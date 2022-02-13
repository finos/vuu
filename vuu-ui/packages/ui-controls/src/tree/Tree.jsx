import React, { forwardRef, useRef } from 'react';
import cx from 'classnames';
import { useId } from '@vuu-ui/react-utils';
import {
  groupSelectionEnabled,
  useItemsWithIds,
  useViewportTracking,
  GROUP_SELECTION_NONE
} from '../common-hooks';
import { closestListItemIndex } from '../list/list-dom-utils';

import { useTree } from './useTree';
import { useForkRef } from '../utils/use-fork-ref';

import './Tree.css';

const classBase = 'hwTree';

// eslint-disable-next-line no-unused-vars
export const TreeNode = ({ children, idx, ...props }) => {
  return <li {...props}>{children}</li>;
};

const Tree = forwardRef(function Tree(
  {
    className,
    defaultSelected,
    groupSelection = GROUP_SELECTION_NONE,
    id: idProp,
    onHighlight,
    onSelectionChange,
    revealSelected,
    selected: selectedProp,
    selection = 'single',
    source,
    ...htmlAttributes
  },
  forwardedRef
) {
  const id = useId(idProp);
  const root = useRef(null);

  // returns the full source data
  const [totalItemCount, sourceWithIds, sourceItemById] = useItemsWithIds(source, id, {
    revealSelected: revealSelected ? selectedProp ?? defaultSelected ?? false : undefined
  });

  const handleSelectionChange = (evt, selected) => {
    onSelectionChange?.(
      evt,
      selected.map((id) => sourceItemById(id))
    );
  };

  const {
    focusVisible,
    highlightedIdx,
    hiliteItemAtIndex,
    listProps,
    listItemHandlers,
    selected,
    visibleData
  } = useTree({
    sourceWithIds,
    defaultSelected,
    groupSelection,
    id,
    onChange: handleSelectionChange,
    onHighlight,
    selected: selectedProp,
    selection,
    totalItemCount
  });

  // const isScrolling = useViewportTracking(root, highlightedIdx);
  useViewportTracking(root, highlightedIdx);

  const defaultItemHandlers = {
    onMouseEnter: (evt) => {
      // if (!isScrolling.current) {
      const idx = closestListItemIndex(evt.target);
      hiliteItemAtIndex(idx);
      // onMouseEnterListItem && onMouseEnterListItem(evt, idx);
      // }
    }
  };

  const propsCommonToAllListItems = {
    ...defaultItemHandlers,
    ...listItemHandlers,
    role: 'treeitem'
  };
  const allowGroupSelect = groupSelectionEnabled(groupSelection);

  /**
   * Add a ListItem from source item
   */
  function addLeafNode(list, item, idx) {
    list.push(
      <TreeNode
        {...propsCommonToAllListItems}
        {...getListItemProps(item, idx, highlightedIdx, selected, focusVisible)}>
        {item.icon ? <span className={`${classBase}Node-icon`} /> : null}
        <span>{item.label}</span>
      </TreeNode>
    );
    idx.value += 1;
  }

  function addGroupNode(list, child, idx, id, title) {
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
          [`${classBase}Node-toggle`]: !allowGroupSelect
        })}
        data-icon={child.icon}
        data-idx={i}
        data-highlighted={i === highlightedIdx || undefined}
        data-selectable
        id={id}
        key={`header-${i}`}>
        {allowGroupSelect ? (
          <div className={`${classBase}Node-label`}>
            <span className={`${classBase}Node-toggle`} />
            {title}
          </div>
        ) : (
          <div className={`${classBase}Node-label`}>
            {child.icon ? <span className={`${classBase}Node-icon`} /> : null}
            <span>{title}</span>
          </div>
        )}
        <ul role="group">{child.expanded ? renderSourceContent(child.childNodes, idx) : ''}</ul>
      </TreeNode>
    );
  }

  function renderSourceContent(items, idx = { value: 0 }) {
    if (items?.length > 0) {
      const listItems = [];
      for (let item of items) {
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
      ref={useForkRef(root, forwardedRef)}
      role="tree"
      tabIndex={0}>
      {renderSourceContent(visibleData)}
    </ul>
  );
});

const getListItemProps = (item, idx, highlightedIdx, selected, focusVisible, className) => ({
  id: item.id,
  key: item.id,
  'aria-level': item.level,
  'aria-selected': selected.includes(item.id) || undefined,
  'data-icon': item.icon,
  'data-idx': idx.value,
  'data-highlighted': idx.value === highlightedIdx || undefined,
  className: cx('hwTreeNode', className, { focusVisible: focusVisible === idx.value })
});

Tree.displayName = 'Tree';
export default Tree;
