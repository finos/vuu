import React, { useMemo } from 'react';
import cx from 'classnames';
import { useId } from '@vuu-ui/react-utils';
import { childItems, sourceItems, useItemsWithIds } from '../common-hooks';
import { usePillbox } from './usePillbox';
import './pillbox.css';

export const Pillbox = ({
  children,
  className,
  defaultHighlightedIdx,
  highlightedIdx: highlightedIdxProp,
  id: idProp,
  onChange,
  onDelete,
  onHighlight,
  selected: selectedProp,
  source,
  tabIndex = 0,
  ...htmlAttributes
}) => {
  console.log(`Pillbox highlightedIdxProp=${highlightedIdxProp}`);
  const id = useId(idProp);
  const items = useMemo(() => sourceItems(source) || childItems(children), [children, source]);
  const [, itemsWithIds, itemById] = useItemsWithIds(items, id);

  console.log({ items });

  console.log({ id, items, itemsWithIds });

  const handleSelectionChange = (evt, selected) => {
    if (onChange) {
      onChange(
        evt,
        selected.map((id) => itemById(id))
      );
    }
  };

  const {
    controlProps,
    // count,
    // draggable,
    focusVisible,
    highlightedIdx,
    // listItemHeaderHandlers,
    itemHandlers,
    // listProps,
    selected,
    visibleData
  } = usePillbox({
    defaultHighlightedIdx,
    highlightedIdx: highlightedIdxProp,
    id,
    onChange: handleSelectionChange,
    onDelete,
    onHighlight,
    // onMouseEnterListItem,
    // selection,
    // selectionKeys,
    selected: selectedProp,
    itemsWithIds
  });

  const propsCommonToAllItems = {
    ...itemHandlers
  };
  const removeStateProps = { count: undefined, index: undefined, expanded: undefined };

  function addChildItem(list, item, idx) {
    const { element, id } = item;

    //TODO do this for all props
    const { onClick } = element.props;
    const listItemProps = onClick
      ? {
          ...propsCommonToAllItems,
          onClick: (evt) => {
            // propsCommonToAllListItems.onClick?.(evt);
            onClick(evt);
          }
        }
      : propsCommonToAllItems;

    list.push(
      React.cloneElement(element, {
        ...listItemProps,
        ...getItemProps(
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

  function renderItems(items, idx = { value: 0 }, end = items.length) {
    if (items?.length > 0) {
      const listItems = [];
      while (idx.value < end) {
        const item = items[idx.value];
        // if (item.childNodes) {
        //   addGroup(listItems, items, idx);
        // } else {
        addChildItem(listItems, item, idx);
        // }
      }
      return listItems;
    }
  }

  return (
    <div
      {...htmlAttributes}
      {...controlProps}
      className={cx('hwPillbox', className)}
      tabIndex={tabIndex}>
      {renderItems(visibleData)}
    </div>
  );
};

const getItemProps = (id, idx, highlightedIdx, selected, focusVisible, className) => ({
  id,
  key: id,
  'aria-selected': selected.includes(id) || undefined,
  'data-idx': idx,
  'data-highlighted': idx === highlightedIdx || undefined,
  className: cx(className, { focusVisible: focusVisible === idx })
});
