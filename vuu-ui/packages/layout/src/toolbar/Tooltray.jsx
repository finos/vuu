import React from 'react';
import cx from 'classnames';

import {
  extractResponsiveProps,
  isResponsiveAttribute,
  OverflowMenu,
  useOverflowObserver
} from '../responsive';
import ToolbarField from './ToolbarField';

import './Tooltray.css';

const renderTools = (items) => {
  const tools = [];
  let index = tools.length - 1;
  return tools.concat(
    items.map((tool) => {
      index += 1;
      if (React.isValidElement(tool)) {
        if (tool.type === Tooltray) {
          return React.cloneElement(tool, {
            className: cx('Toolbar-item', tool.props.className),
            'data-index': index,
            'data-priority': tool.props['data-priority'] ?? 2
          });
        } else {
          if (Object.keys(tool.props).some(isResponsiveAttribute)) {
            const [toolbarProps, props] = extractResponsiveProps(tool.props);
            return (
              <ToolbarField {...toolbarProps} data-index={index} data-priority={2} key={index}>
                {/* We clone here just to remove the responsive props */}
                {React.cloneElement(tool, props)}
              </ToolbarField>
            );
          } else {
            return (
              <ToolbarField data-index={index} data-priority={2} key={index}>
                {tool}
              </ToolbarField>
            );
          }
        }
      }
    })
  );
};

const Tooltray = ({
  children,
  className: classNameProp,
  collapse: collapseProp,
  collapsed: collapsedProp,
  'data-collapsible': collapse = collapseProp,
  'data-collapsed': collapsed = collapsedProp,
  orientation = 'horizontal',
  ...rest
}) => {
  const className = cx('hwTooltray', classNameProp);

  const [innerContainerRef, overflowedItems] = useOverflowObserver(orientation, 'Tooltray');

  const childIsFunction = typeof children === 'function';
  const collapsible = childIsFunction ? 'instant' : collapse;
  const tooltrayProps = {
    className,
    'data-collapsed': collapsed,
    'data-collapsible': collapsible
  };

  const tooltrayItems = childIsFunction
    ? children({ collapsed })
    : React.isValidElement(children)
    ? [children]
    : children;

  return (
    <div {...rest} {...tooltrayProps}>
      <div className="Responsive-inner" ref={innerContainerRef}>
        {renderTools(tooltrayItems)}
        {overflowedItems.length > 0 ? (
          <ToolbarField data-overflow-indicator data-pad-left data-priority={1}>
            <OverflowMenu
              className="Toolbar-overflowMenu"
              data-pad-left
              data-priority={1}
              data-index={tooltrayItems.length - 1}
              key="overflow"
              source={overflowedItems}
            />
          </ToolbarField>
        ) : null}
      </div>
    </div>
  );
};

export default Tooltray;
