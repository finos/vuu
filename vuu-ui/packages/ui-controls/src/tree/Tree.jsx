import React, { forwardRef, useRef } from 'react';
import cx from 'classnames';
import { useId } from '@vuu-ui/react-utils';
import { useItemsWithIds } from '../common-hooks';
import { groupSelectionEnabled } from './use-selection';
import { useViewportTracking } from '../list/use-viewport-tracking';
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
    groupSelection,
    id: idProp,
    onHighlight,
    onSelectionChange,
    selected: selectedProp,
    selection = 'single',
    source,
    ...props
  },
  forwardedRef
) {
  const id = useId(idProp);
  const root = useRef(null);

  // returns the full source data
  const [totalItemCount, sourceWithIds] = useItemsWithIds(source, id);

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
    onChange: onSelectionChange,
    onHighlight,
    selected: selectedProp,
    selection,
    totalItemCount
  });

  console.log({ selected });

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
        {...getListItemProps(item.id, idx.value, highlightedIdx, selected, focusVisible)}>
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
        aria-selected={selected.includes(id) || undefined}
        className={cx('hwTreeNode', {
          focusVisible: focusVisible === i,
          'hwTreeNode-toggle': !allowGroupSelect
        })}
        data-idx={i}
        data-highlighted={i === highlightedIdx || undefined}
        data-selectable
        id={id}
        key={`header-${i}`}>
        {allowGroupSelect ? (
          <div>
            <span className="hwTreeNode-toggle" />
            {title}
          </div>
        ) : (
          <div>
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
      {...props}
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

const getListItemProps = (id, idx, highlightedIdx, selected, focusVisible, className) => ({
  id,
  key: id,
  'aria-selected': selected.includes(id) || undefined,
  'data-idx': idx,
  'data-highlighted': idx === highlightedIdx || undefined,
  className: cx('hwTreeNode', className, { focusVisible: focusVisible === idx })
});

Tree.displayName = 'Tree';
export default Tree;
