import React, { useCallback } from 'react';
import cx from 'classnames';
import { Button } from '@vuu-ui/ui-controls';

import { useControlled } from '../utils';

import './Drawer.css';

const sizeAttribute = (value) => {
  return typeof value === 'string' ? value : value + 'px';
};

const getStyle = (styleProp, sizeOpen, sizeClosed) => {
  const hasSizeOpen = sizeOpen !== undefined;
  const hasSizeClosed = sizeClosed !== undefined;

  if (!styleProp && !hasSizeClosed && !hasSizeOpen) {
    return undefined;
  }

  if (!hasSizeClosed && !hasSizeOpen) {
    return styleProp;
  }

  return {
    ...styleProp,
    '--drawer-size': hasSizeOpen ? sizeAttribute(sizeOpen) : undefined,
    '--drawer-peek-size': hasSizeClosed ? sizeAttribute(sizeClosed) : undefined
  };
};

const Drawer = ({
  children,
  className: classNameProp,
  clickToOpen,
  defaultOpen,
  sizeOpen,
  sizeClosed,
  style: styleProp,
  open: openProp,
  position = 'left',
  inline,
  onClick,
  peekaboo = false,
  toggleButton,
  ...props
}) => {
  const [open, setOpen] = useControlled({
    controlled: openProp,
    default: defaultOpen ?? false,
    name: 'Drawer',
    state: 'open'
  });

  const classBase = 'hwDrawer';

  const className = cx(classBase, classNameProp, `${classBase}-${position}`, {
    [`${classBase}-open`]: open,
    [`${classBase}-inline`]: inline,
    [`${classBase}-over`]: !inline,
    [`${classBase}-peekaboo`]: peekaboo
  });

  const toggleDrawer = useCallback(() => {
    console.log('toggleDrawer');
    setOpen(!open);
  }, [open, setOpen]);

  const style = getStyle(styleProp, sizeOpen, sizeClosed);

  const handleClick = clickToOpen ? toggleDrawer : onClick;

  const renderToggleButton = () => (
    <div className={cx('hwToggleButton-container')}>
      {open ? (
        <Button aria-label="close" onClick={toggleDrawer} data-icon />
      ) : (
        <Button aria-label="open" onClick={toggleDrawer} data-icon />
      )}
    </div>
  );

  return (
    <div {...props} className={className} onClick={handleClick} style={style}>
      {toggleButton == 'start' ? renderToggleButton() : null}
      <div className={`${classBase}-liner`}>
        <div className={`${classBase}-content`}>{children}</div>
      </div>
      {toggleButton == 'end' ? renderToggleButton() : null}
    </div>
  );
};
Drawer.displayName = 'Drawer';

export default Drawer;
