import React, { forwardRef, memo, useMemo, useRef } from "react";
import cx from "classnames";
import { useId } from "@vuu-ui/react-utils";
import { useItemsWithIds } from "../common-hooks";
import { childItems, sourceItems } from "./list-items";
import { useList } from "./useList";
// import { closestListItemIndex } from './list-dom-utils';
import { useForkRef } from "../utils/use-fork-ref";

import "./list.css";

const defaultEmptyMessage = "No data to display";
const classBase = "hwList";

// Note: the memo is effective if List label is passed as simple string
// If children are used, it is the responsibility of caller to memoise
// these if performance on highlight is perceived to be an issue.
export const ListItem = memo(({ children, label, ...props }) => {
  return children ? (
    <div {...props}>{children}</div>
  ) : (
    <div {...props}>
      <span>{label}</span>
    </div>
  );
});
ListItem.displayName = "ListItem";

const removeStateProps = {
  count: undefined,
  index: undefined,
  expanded: undefined,
};

const List = forwardRef(function List(
  {
    allowDragDrop,
    children,
    className,
    collapsibleHeaders = false,
    defaultHighlightedIdx,
    defaultSelected,
    emptyMessage,
    highlightedIdx: highlightedIdxProp,
    id: idProp,
    listItemHandlers: listItemHandlersProp,
    onCommit,
    onChange = onCommit, // onSelectionChange
    onHighlight,
    onMouseEnterListItem,
    selected: selectedProp,
    selection = "single",
    selectionKeys,
    showEmptyMessage = false,
    source,
    stickyHeaders,
    ...htmlAttributes
  },
  forwardedRef
) {
  const id = useId(idProp, "List");
  const root = useRef(null);
  const items = useMemo(
    () => sourceItems(source) || childItems(children),
    [children, source]
  );
  const [totalItemCount, itemsWithIds, itemById] = useItemsWithIds(items, id, {
    collapsibleHeaders,
    defaultExpanded: true,
    label: "List",
  });

  const handleSelectionChange = (evt, selected) => {
    if (onChange) {
      onChange(
        evt,
        selected.map((id) => itemById(id))
      );
    }
  };

  const {
    count,
    draggable,
    focusVisible,
    highlightedIdx,
    listItemHeaderHandlers,
    listItemHandlers,
    listProps,
    selected,
    visibleData,
  } = useList({
    allowDragDrop,
    collapsibleHeaders,
    defaultHighlightedIdx,
    defaultSelected,
    highlightedIdx: highlightedIdxProp,
    id,
    listItemHandlers: listItemHandlersProp,
    onChange: handleSelectionChange,
    onHighlight,
    onMouseEnterListItem,
    containerRef: root,
    selected: selectedProp,
    selection,
    selectionKeys,
    sourceWithIds: itemsWithIds,
    stickyHeaders,
    totalItemCount,
  });

  const propsCommonToAllListItems = {
    ...listItemHandlers,
    role: "option",
  };

  function createHeader(idx, headerId, title, expanded) {
    // TODO we don;t want to replace a custom header with this
    // TODO aria-selected
    const header = (
      <ListItem
        {...listItemHeaderHandlers}
        className={cx("hwListItemHeader", "hwListItem", {
          focusVisible: collapsibleHeaders && focusVisible === idx.value,
        })}
        aria-expanded={expanded}
        data-idx={collapsibleHeaders ? idx.value : undefined}
        data-highlighted={idx.value === highlightedIdx || undefined}
        data-sticky={stickyHeaders}
        data-selectable={false}
        id={headerId}
        key={`header-${idx.value}`}
        label={title}
        role="presentation"
      />
    );
    idx.value += 1;
    return header;
  }

  function addSourceItem(list, item, idx) {
    list.push(
      <ListItem
        {...propsCommonToAllListItems}
        {...getListItemProps(
          item.id,
          idx.value,
          highlightedIdx,
          selected,
          focusVisible
        )}
        label={item.label}
      />
    );
    idx.value += 1;
  }

  function addGroup(list, items, idx) {
    const { count, id, expanded, label } = items[idx.value];
    const header = createHeader(idx, id, label, expanded);
    const renderTargetContent = source
      ? renderSourceContent
      : renderChildContent;
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
          listItems.push(
            createHeader(idx, item.id, item.label, item.expanded === false)
          );
        } else if (item.childNodes) {
          addGroup(listItems, items, idx);
        } else {
          addSourceItem(listItems, item, idx);
        }
      }
      return listItems;
    }
  }

  // TODO do we need to make special provision for memo here ?
  function addChildItem(list, item, idx) {
    const { element, id } = item;

    //TODO do this for all props
    const { onClick } = element.props;
    const listItemProps = onClick
      ? {
          ...propsCommonToAllListItems,
          onClick: (evt) => {
            propsCommonToAllListItems.onClick?.(evt);
            onClick(evt);
          },
        }
      : propsCommonToAllListItems;

    list.push(
      React.cloneElement(element, {
        ...listItemProps,
        ...getListItemProps(
          id,
          idx.value,
          highlightedIdx,
          selected,
          focusVisible,
          element.props.className
        ),
        ...removeStateProps,
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
          listItems.push(
            createHeader(idx, item.id, item.label, item.expanded === false)
          );
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
        <span className={`${classBase}-empty-message`}>
          {emptyMessage ?? defaultEmptyMessage}
        </span>
      );
    } else {
      return null;
    }
  }

  const renderItems = () => {
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
      {...htmlAttributes}
      {...listProps}
      className={cx(classBase, className, {
        "empty-list": count === 0,
        "with-checkbox": selection.startsWith("checkbox"),
        "checkbox-only": selection === "checkbox-only",
        [`${classBase}-collapsible`]: collapsibleHeaders,
      })}
      id={`${id}`}
      ref={useForkRef(root, forwardedRef)}
      role="listbox"
      tabIndex={0}
    >
      {renderItems()}
      {draggable}
    </div>
  );
});

const getListItemProps = (
  id,
  idx,
  highlightedIdx,
  selected,
  focusVisible,
  className
) => ({
  id,
  key: id,
  "aria-selected": selected.includes(id) || undefined,
  "data-idx": idx,
  "data-highlighted": idx === highlightedIdx || undefined,
  className: cx("hwListItem", className, {
    focusVisible: focusVisible === idx,
  }),
});

List.displayName = "List";
export default List;
