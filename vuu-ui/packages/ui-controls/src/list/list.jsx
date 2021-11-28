import React, { forwardRef, useRef } from 'react';
import cx from 'classnames';
import { useId } from '@vuu-ui/react-utils';
import { useItemsWithIds } from '../common-hooks';
import { useList } from './useList';
import { useViewportTracking } from './use-viewport-tracking';
import { closestListItemIndex } from './list-dom-utils';
import { useForkRef } from '../utils/use-fork-ref';
import { createListProxy } from './list-proxy';
import { ListItemGroup } from './list-item-group';
import { ListItemHeader } from './list-item-header';

import './list.css';

const defaultEmptyMessage = 'No data to display';
const classBase = 'hwList';

// eslint-disable-next-line no-unused-vars
export const ListItem = ({ children, idx, ...props }) => {
  // console.log(`[ListItem] render ${idx}`);
  return <div {...props}>{children}</div>;
};

export const isGroup = (child) => child.type === ListItemGroup || !!child.props['data-group'];
export const isHeader = (child) => child.type === ListItemHeader || !!child.props['data-header'];

const removeStateProps = { count: undefined, index: undefined, expanded: undefined };

const List = forwardRef(function List(
  {
    children,
    className,
    collapsibleHeaders = false,
    defaultHighlightedIdx,
    defaultSelected,
    emptyMessage,
    onCommit,
    onChange = onCommit, // onSelectioNChange
    onHighlight,
    onMouseEnterListItem,
    highlightedIdx: highlightedIdxProp,
    id: idProp,
    selected: selectedProp,
    selection = 'single',
    showEmptyMessage = false,
    source,
    stickyHeaders,
    ...props
  },
  forwardedRef
) {
  const id = useId(idProp, 'List');
  const root = useRef(null);

  const [totalItemCount, sourceWithIds] = useItemsWithIds(source || children, id, {
    collapsibleHeaders,
    defaultExpanded: true,
    createProxy: source ? undefined : createListProxy
  });

  const {
    count,
    focusVisible,
    highlightedIdx,
    hiliteItemAtIndex,
    listItemHeaderHandlers,
    listItemHandlers,
    listProps,
    selected,
    visibleData
  } = useList({
    collapsibleHeaders,
    defaultHighlightedIdx,
    defaultSelected,
    highlightedIdx: highlightedIdxProp,
    id,
    onChange,
    onHighlight,
    selected: selectedProp,
    selection,
    sourceWithIds,
    totalItemCount
  });

  const isScrolling = useViewportTracking(root, highlightedIdx, stickyHeaders);

  const defaultItemHandlers = {
    onMouseEnter: (evt) => {
      if (!isScrolling.current) {
        const idx = closestListItemIndex(evt.target);
        hiliteItemAtIndex(idx);
        onMouseEnterListItem && onMouseEnterListItem(evt, idx);
      }
    }
  };

  const propsCommonToAllListItems = {
    ...defaultItemHandlers,
    ...listItemHandlers,
    role: 'option'
  };

  function createHeader(idx, headerId, title, expanded) {
    // TODO we don;t want to replace a custom header with this
    const header = (
      <ListItem
        {...listItemHeaderHandlers}
        className={cx('hwListItemHeader', 'hwListItem', {
          focusVisible: collapsibleHeaders && focusVisible === idx.value
        })}
        aria-expanded={expanded}
        data-idx={collapsibleHeaders ? idx.value : undefined}
        data-highlighted={idx.value === highlightedIdx || undefined}
        data-sticky={stickyHeaders}
        data-selectable={false}
        id={headerId}
        key={`header-${idx.value}`}
        role="presentation">
        {title}
      </ListItem>
    );
    idx.value += 1;
    return header;
  }

  function addSourceItem(list, item, idx) {
    list.push(
      <ListItem
        {...propsCommonToAllListItems}
        {...getListItemProps(item.id, idx.value, highlightedIdx, selected, focusVisible)}>
        <span>{item.label}</span>
      </ListItem>
    );
    idx.value += 1;
  }

  function addGroup(list, items, idx) {
    const { count, id, expanded, label } = items[idx.value];
    const header = createHeader(idx, id, label, expanded);
    const renderTargetContent = source ? renderSourceContent : renderChildContent;
    const childItems =
      expanded !== false
        ? [header].concat(renderTargetContent(items, idx, idx.value + count))
        : header;
    list.push(
      <div key={id} role="group">
        {childItems}
      </div>
    );
  }

  function renderSourceContent(items, idx = { value: 0 }, end = items.length) {
    if (items?.length > 0) {
      const listItems = [];
      while (idx.value < end) {
        const item = items[idx.value];
        if (item.header) {
          listItems.push(createHeader(idx, item.id, item.label, item.expanded === false));
        } else if (item.childNodes) {
          addGroup(listItems, items, idx);
        } else {
          addSourceItem(listItems, item, idx);
        }
      }
      return listItems;
    }
  }

  function addChildItem(list, item, idx) {
    const { wrappedSource: element, id } = item;
    list.push(
      React.cloneElement(element, {
        ...propsCommonToAllListItems,
        ...getListItemProps(
          id,
          idx.value,
          highlightedIdx,
          selected,
          focusVisible,
          element.props.className
        ),
        ...removeStateProps
      })
    );
    idx.value += 1;
  }

  function renderChildContent(items, idx = { value: 0 }, end = items.length) {
    if (items?.length > 0) {
      const listItems = [];
      while (idx.value < end) {
        const item = items[idx.value];
        if (item.header) {
          listItems.push(createHeader(idx, item.id, item.label, item.expanded === false));
        } else if (item.childNodes) {
          addGroup(listItems, items, idx);
        } else {
          addChildItem(listItems, item, idx);
        }
      }
      return listItems;
    }
  }

  function renderEmpty() {
    if (emptyMessage || showEmptyMessage) {
      return (
        <span className={`${classBase}-empty-message`}>{emptyMessage ?? defaultEmptyMessage}</span>
      );
    } else {
      return null;
    }
  }

  const renderContent = () => {
    if (source) {
      return renderSourceContent(visibleData);
    } else if (children) {
      return renderChildContent(visibleData);
    } else {
      renderEmpty();
    }
  };

  return (
    <div
      {...props}
      {...listProps}
      className={cx(classBase, className, {
        'empty-list': count === 0,
        'with-checkbox': selection.startsWith('checkbox'),
        'checkbox-only': selection === 'checkbox-only',
        [`${classBase}-collapsible`]: collapsibleHeaders
      })}
      id={`${id}`}
      ref={useForkRef(root, forwardedRef)}
      role="listbox"
      tabIndex={0}>
      {renderContent()}
    </div>
  );
});

const getListItemProps = (id, idx, highlightedIdx, selected, focusVisible, className) => ({
  id,
  key: id,
  'aria-selected': selected.includes(idx) || undefined,
  'data-idx': idx,
  'data-highlighted': idx === highlightedIdx || undefined,
  className: cx('hwListItem', className, { focusVisible: focusVisible === idx })
});

List.displayName = 'List';
export default List;
