import React, {
  memo,
  useMemo
  // useEffect,
} from 'react';
import cx from 'classnames';
import { useId } from '@vuu-ui/react-utils';
import { useVirtualization } from './use-virtualization';
import { useViewportTracking } from './use-viewport-tracking';
import { useItemsWithIds } from './virtualized-use-items-with-ids';
import { useKeyboardNavigation, useSelection } from '../common-hooks';
import { closestListItemIndex } from '../common-hooks/list-dom-utils';

import './list.css';

const classBase = 'hwList';

const ListItem = memo(({ children, 'data-offset': offset, ...props }) => {
  return (
    <div
      {...props}
      data-offset={offset}
      style={{
        transform: `translate3d(0px, ${offset}px, 0px)`
      }}>
      {children}
    </div>
  );
});
ListItem.displayName = 'ListItem';

export const VirtualizedList = ({
  children: childrenProp,
  className,
  defaultSelected,
  onCommit,
  onChange = onCommit,
  onMouseEnterListItem,
  highlightedIdx: highlightedIdxProp,
  id: idProp,
  selected: selectedProp,
  selection = 'single',
  source: sourceProp
}) => {
  const id = useId(idProp);
  // const root = useRef(null);
  const mapIdxToId = useMemo(() => new Map(), []);

  const [count, source] = useItemsWithIds(sourceProp, childrenProp);

  const [viewportRef, data, contentHeight, onScroll] = useVirtualization(source);

  const {
    listHandlers: listSelectionHandlers,
    listItemHandlers: listItemSelectionHandlers,
    selected
  } = useSelection(
    {
      defaultSelected,
      onChange,
      selected: selectedProp,
      selection
    },
    'List'
  );

  const { controlledHighlighting, focusVisible, highlightedIdx, hiliteItemAtIndex, listProps } =
    useKeyboardNavigation(
      {
        count: source.length,
        highlightedIdx: highlightedIdxProp,
        id,
        selected,
        label: 'List'
      },
      listSelectionHandlers
    );

  const isScrolling = useViewportTracking(viewportRef, highlightedIdx);

  const defaultListItemHandlers = {
    onMouseEnter: (evt) => {
      if (!isScrolling.current) {
        const idx = closestListItemIndex(evt.target);
        if (!controlledHighlighting) {
          hiliteItemAtIndex(idx);
        }
        onMouseEnterListItem && onMouseEnterListItem(evt, idx);
      }
    }
  };

  const getActiveDescendant = () =>
    highlightedIdx === undefined || highlightedIdx === -1
      ? undefined
      : mapIdxToId.get(highlightedIdx);

  return (
    <div
      {...listProps}
      aria-activedescendant={getActiveDescendant()}
      className={cx(classBase, className, {
        'empty-list': count === 0,
        'with-checkbox': selection.startsWith('checkbox'),
        'checkbox-only': selection === 'checkbox-only'
      })}
      tabIndex={0}>
      <div className="hwList-viewport" onScroll={onScroll} ref={viewportRef}>
        <div className="hwList-scrollingContentContainer" style={{ height: contentHeight }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );

  function renderContent() {
    mapIdxToId.clear();

    const propsCommonToAllListItems = {
      ...defaultListItemHandlers,
      ...listItemSelectionHandlers,
      role: 'option'
    };

    const listItems = [];
    for (let [key, offset, pos, item] of data) {
      const idx = pos - 1;
      const itemId = `${id}-${idx}`;
      listItems.push(
        <ListItem
          {...propsCommonToAllListItems}
          {...getListItemProps(itemId, idx, key, highlightedIdx, selected, focusVisible)}
          aria-setsize={source.length}
          aria-posinset={pos}
          data-offset={offset}>
          {item}
        </ListItem>
      );
      mapIdxToId.set(idx, itemId);
    }
    return listItems;
  }
};

const getListItemProps = (id, idx, key, highlightedIdx, selected, focusVisible, className) => ({
  id,
  key: key ?? idx,
  'aria-selected': selected.includes(idx) || undefined,
  'data-idx': idx,
  'data-highlighted': idx === highlightedIdx || undefined,
  className: cx('hwListItem', className, { focusVisible: focusVisible === idx })
});
