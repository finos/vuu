import React, { useRef } from 'react';
import cx from 'classnames';

import {
  extractResponsiveProps,
  isResponsiveAttribute,
  OverflowMenu,
  useOverflowObserver
} from '../responsive';

import { Tabstrip } from '../tabstrip';
import ToolbarField from './ToolbarField';
import Tooltray from './Tooltray';

import './Toolbar.css';

const renderTools = (items, collapsedItems = []) => {
  const tools = [];
  let index = tools.length - 1;
  let rightAlign = false;
  return tools.concat(
    items.map((tool) => {
      index += 1;
      // index is a fragile way to link these, we need some kind of id and map
      const collapsed =
        collapsedItems.findIndex((item) => item.index === index) === -1 ? undefined : true;
      let dataPadLeft = undefined;
      if (React.isValidElement(tool)) {
        if ((tool.props.align === 'right' || tool.props['data-pad-left']) && !rightAlign) {
          rightAlign = true;
          dataPadLeft = true;
        }

        const toolbarItemProps = {
          className: cx('Toolbar-item', tool.props.className),
          'data-index': index,
          'data-priority': tool.props['data-priority'] ?? 2,
          'data-pad-left': dataPadLeft,
          'data-collapsed': collapsed,
          key: index
        };

        if (tool.type === Tooltray || tool.type === Tabstrip) {
          return React.cloneElement(tool, {
            ...toolbarItemProps
            // collapsed,
          });
        } else if (tool.type === ToolbarField) {
          return React.cloneElement(tool, toolbarItemProps);
        } else {
          const [toolbarProps, props] = Object.keys(tool.props).some(isResponsiveAttribute)
            ? extractResponsiveProps(tool.props)
            : [{}, tool.props];

          return (
            <ToolbarField {...toolbarProps} {...toolbarItemProps}>
              {props === tool.props ? tool : React.cloneElement(tool, props)}
            </ToolbarField>
          );
        }
      } else {
        // ignore
      }
    })
  );
};

const Toolbar = ({
  children,
  className,
  id,
  // eslint-disable-next-line no-unused-vars
  maxRows: _1,
  orientation = 'horizontal',
  style,
  tools: toolsProp,
  getTools = () => (toolsProp || React.isValidElement(children) ? [children] : children),
  ...rootProps
}) => {
  const root = useRef(null);
  const [innerContainerRef, overflowedItems, collapsedItems] = useOverflowObserver(
    orientation,
    'Toolbar'
  );

  const tools = getTools();

  return (
    <div
      {...rootProps}
      id={id}
      // breakPoints={stops}
      className={cx('hwToolbar', `hwToolbar-${orientation}`, className)}
      ref={root}
      // onResize={setSize}
      style={style}
    >
      <div className="Responsive-inner" ref={innerContainerRef}>
        {renderTools(tools, collapsedItems)}
        {overflowedItems.length > 0 ? (
          <ToolbarField data-overflow-indicator data-pad-left data-priority={1}>
            <OverflowMenu
              className="Toolbar-overflowMenu"
              data-pad-left
              data-priority={1}
              data-index={tools.length - 1}
              key="overflow"
              source={overflowedItems}
            />
          </ToolbarField>
        ) : null}
      </div>
    </div>
  );
};

export default Toolbar;

Toolbar.displayName = 'Toolbar';

// registerComponent('Toolbar', Toolbar);
