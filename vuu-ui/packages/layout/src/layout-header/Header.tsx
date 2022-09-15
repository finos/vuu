import { Button } from '@vuu-ui/ui-controls';
import classnames from 'classnames';
import React, { HTMLAttributes, MouseEvent } from 'react';
import { Contribution, useViewDispatch } from '../layout-view';
import ActionButton from './ActionButton';

import './Header.css';

export interface HeaderProps extends HTMLAttributes<HTMLDivElement> {
  collapsed?: boolean;
  contributions?: Contribution[];
  expanded?: boolean;
  closeable?: boolean;
  orientation?: 'horizontal' | 'vertical';
  tearOut?: boolean;
}

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
}: HeaderProps) => {
  const layoutDispatch = useViewDispatch();
  const handleAction = (
    evt: MouseEvent,
    actionId: 'maximize' | 'restore' | 'minimize' | 'tearout'
  ) => layoutDispatch?.({ type: actionId }, evt);
  const handleClose = (evt: MouseEvent) => layoutDispatch?.({ type: 'remove' }, evt);
  const classBase = 'hwHeader';

  const handleMouseDown = (e: MouseEvent) => {
    layoutDispatch?.({ type: 'mousedown' }, e);
  };

  const handleButtonMouseDown = (evt: MouseEvent) => {
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
          aria-label="Minimize View"
          actionId="minimize"
          iconName="minimize"
          onClick={handleAction}
          onMouseDown={handleButtonMouseDown}
        />
      ) : null}
      {collapsed ? (
        <ActionButton
          aria-label="Restore View"
          actionId="restore"
          iconName="double-chevron-right"
          onClick={handleAction}
          onMouseDown={handleButtonMouseDown}
        />
      ) : null}
      {expanded === false ? (
        <ActionButton
          aria-label="Maximize View"
          actionId="maximize"
          iconName="maximize"
          onClick={handleAction}
          onMouseDown={handleButtonMouseDown}
        />
      ) : null}
      {expanded ? (
        <ActionButton
          aria-label="Restore View"
          actionId="restore"
          iconName="restore"
          onClick={handleAction}
          onMouseDown={handleButtonMouseDown}
        />
      ) : null}
      {tearOut ? (
        <ActionButton
          aria-label="Tear out View"
          actionId="tearout"
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
