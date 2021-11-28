import React from 'react';
import classnames from 'classnames';
import { Action } from './layout-action';
import ActionButton from './ActionButton';
import { useLayoutDispatch } from './layout-context';
import { Button } from '@vuu-ui/ui-controls';

import './Header.css';

const Header = ({
  className: classNameProp,
  contributions = [],
  collapsed,
  expanded,
  closeable,
  orientation: orientationProp = 'horizontal',
  style,
  tearOut,
  title
}) => {
  const layoutDispatch = useLayoutDispatch();
  const handleAction = (evt, actionId) => layoutDispatch({ type: actionId });
  const handleClose = () => layoutDispatch({ type: Action.REMOVE });
  const classBase = 'hwHeader';

  const handleMouseDown = (e) => {
    layoutDispatch({ type: 'mousedown' }, e);
  };

  const handleButtonMouseDown = (evt) => {
    // do not allow drag to be initiated
    evt.stopPropagation();
  };

  const orientation = collapsed || orientationProp;

  const className = classnames(classBase, classNameProp, `${classBase}-${orientation}`);

  return (
    <div className={className} style={style} onMouseDown={handleMouseDown}>
      {title ? (
        <>
          <span className={`${classBase}-title-container`}>
            <span className={`${classBase}-title`}>{title}</span>
            {contributions.map(({ content }, index) => React.cloneElement(content, { key: index }))}
          </span>
        </>
      ) : null}
      {collapsed === false ? (
        <ActionButton
          accessibleText="Minimize View"
          actionId={Action.MINIMIZE}
          iconName="minimize"
          onClick={handleAction}
          onMouseDown={handleButtonMouseDown}
        />
      ) : null}
      {collapsed ? (
        <ActionButton
          accessibleText="Restore View"
          actionId={Action.RESTORE}
          iconName="double-chevron-right"
          onClick={handleAction}
          onMouseDown={handleButtonMouseDown}
        />
      ) : null}
      {expanded === false ? (
        <ActionButton
          accessibleText="Maximize View"
          actionId={Action.MAXIMIZE}
          iconName="maximize"
          onClick={handleAction}
          onMouseDown={handleButtonMouseDown}
        />
      ) : null}
      {expanded ? (
        <ActionButton
          accessibleText="Restore View"
          actionId={Action.RESTORE}
          iconName="restore"
          onClick={handleAction}
          onMouseDown={handleButtonMouseDown}
        />
      ) : null}
      {tearOut ? (
        <ActionButton
          accessibleText="Tear out View"
          actionId={Action.TEAR_OUT}
          iconName="tear-out"
          onClick={handleAction}
          onMouseDown={handleButtonMouseDown}
        />
      ) : null}
      {closeable ? (
        <Button
          aria-label="close"
          data-icon
          onClick={handleClose}
          onMouseDown={handleButtonMouseDown}
        />
      ) : null}
    </div>
  );
};

export default Header;
