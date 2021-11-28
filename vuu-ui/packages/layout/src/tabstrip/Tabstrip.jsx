import React, { useLayoutEffect, useRef } from 'react';
import classnames from 'classnames';
import useTabstrip from './useTabstrip';
import { OverflowMenu, useOverflowObserver } from '../responsive';
import ActivationIndicator from './ActivationIndicator';
import { Button } from '@vuu-ui/ui-controls';

import './Tabstrip.css';

const Tabstrip = (props) => {
  const root = useRef(null);

  const {
    centered = false,
    children,
    enableAddTab,
    enableCloseTabs,
    keyBoardActivation: _1,
    onAddTab,
    onDeleteTab: _2,
    orientation = 'horizontal',
    showActivationIndicator = true,
    style,
    title,
    ...rootProps
  } = props;

  const childCount = useRef(React.Children.count(children));
  const classRoot = 'hwTabstrip';

  const [innerContainerRef, overflowedItems, , resetOverflow] = useOverflowObserver(
    orientation,
    'Tabstrip'
  );

  const { activateTab, tabProps, tabRefs, value } = useTabstrip(props, root);
  const selectedIndex = useRef(value ?? 0);

  const handleOverflowChange = (e, tab) => {
    activateTab(e, tab.index);
  };

  const handleTabMouseDown = (e, index) => {
    if (rootProps.onMouseDown) {
      e.stopPropagation();
      rootProps.onMouseDown(e, index);
    }
  };

  // shouldn't we use ref for this ?
  useLayoutEffect(() => {
    // We don't care about changes to overflowedItems here, the overflowObserver
    // always does the right thing. We only care about changes to selected tab
    if (selectedIndex.current !== value) {
      // We might want to do this only if the selected tab is overflowed ?
      resetOverflow();
      selectedIndex.current = value;
    }
  }, [resetOverflow, value]);

  useLayoutEffect(() => {
    if (React.Children.count(children) !== childCount.current) {
      childCount.current = React.Children.count(children);
      resetOverflow();
    }
  }, [children, resetOverflow]);

  const renderContent = () => {
    const tabs = [];

    const array = React.isValidElement(children) ? [children] : children;
    array.forEach((child, index) => {
      const selected = index === value;
      const overflowed = overflowedItems.findIndex((item) => item.index === index) !== -1;
      tabs.push(
        React.cloneElement(child, {
          index,
          ...tabProps,
          key: index,
          'data-index': index,
          'data-priority': selected ? 1 : 3,
          'data-overflowed': overflowed ? true : undefined,
          deletable: child.props.deletable ?? enableCloseTabs,
          onMouseDown: handleTabMouseDown,
          orientation,
          ref: tabRefs[index],
          selected
        })
      );
    });

    tabs.push(
      <OverflowMenu
        className={`${classRoot}-overflowMenu`}
        data-priority={0}
        data-index={tabs.length}
        data-overflow-indicator
        key="overflow"
        onChange={handleOverflowChange}
        source={overflowedItems}
      />
    );

    if (enableAddTab) {
      tabs.push(
        <Button
          aria-label="add tab"
          data-icon
          data-index={tabs.length}
          data-priority={2}
          key="tabstrip-add"
          onClick={onAddTab}
          title={title}
        />
      );
    }

    return tabs;
  };

  const selectedTabOverflowed = overflowedItems.some((item) => item.index === value);
  const className = classnames(classRoot, `${classRoot}-${orientation}`, {
    [`${classRoot}-centered`]: centered
  });

  const tabRef = value === -1 ? { current: null } : tabRefs[value ?? 0];
  return (
    <div {...rootProps} className={className} ref={root} role="tablist" style={style}>
      <div className={`${classRoot}-inner`} ref={innerContainerRef} style={{ lineHeight: '36px' }}>
        {renderContent()}
      </div>
      {showActivationIndicator ? (
        <ActivationIndicator
          hideThumb={selectedTabOverflowed}
          key="activation-ind"
          orientation={orientation}
          tabRef={tabRef}
        />
      ) : null}
    </div>
  );
};

Tabstrip.displayName = 'Tabstrip';

export default Tabstrip;
