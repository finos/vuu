import React, { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import cx from 'classnames';
import { Portal } from '@vuu-ui/theme';
import { useForkRef } from '../utils/use-fork-ref';

import './dropdown.css';

const classBase = 'hwDropdown';

const listenforClickAway = (listen, handler) => {
  if (listen) {
    document.body.addEventListener('click', handler, true);
    document.body.addEventListener('keydown', handler, true);
  } else {
    document.body.removeEventListener('click', handler, true);
    document.body.removeEventListener('keydown', handler, true);
  }
};

const useDropdownChildren = (children) => {
  if (React.Children.count(children) === 1) {
    return [children];
  }
  let mainChild,
    header = null,
    footer = null;
  React.Children.forEach(children, (child) => {
    if (child !== null) {
      if (child.props['data-header']) {
        header = child;
      } else if (child.props['data-footer']) {
        footer = child;
      } else if (mainChild !== undefined) {
        throw new Error(
          `Dropdown can only contain a single child dropdown element. Header and Footer must use 'data-header', 'data-footer data attributes'`
        );
      } else {
        mainChild = child;
      }
    }
  });
  return [mainChild, header, footer];
};

export const Dropdown = forwardRef(function Dropdown(
  {
    align = 'bottom-left',
    autofocus = false,
    children,
    className,
    anchorEl,
    onCancel,
    onCommit,
    open,
    listHeight,
    style,
    width: widthProp = 'anchor'
  },
  ref
) {
  const [child, dropdownHeader, dropdownFooter] = useDropdownChildren(children);

  const contentRef = useRef(null);
  const setContentRef = useCallback(
    (contentEl) => {
      contentRef.current = contentEl;
      if (autofocus && contentEl) {
        contentEl.focus();
      }
    },
    [autofocus]
  );
  const forkedContentRef = useForkRef(setContentRef, child.ref);

  const rootRef = useRef(null);
  const forkedRootRef = useForkRef(ref, rootRef);

  const [position, setPosition] = useState(null);

  const handleClickAway = useCallback(
    (evt) => {
      const { key, target, type } = evt;
      if (type === 'keydown' && key === 'Escape') {
        onCancel?.();
      } else if (type === 'click') {
        const el = rootRef.current;
        const maybeAway = !equalsOrContains(el, target);
        if (maybeAway) {
          const definatelyAway = !equalsOrContains(anchorEl, target);
          if (definatelyAway) {
            onCancel?.();
          }
        }
      }
    },
    [anchorEl, onCancel]
  );

  useEffect(() => {
    if (open) {
      listenforClickAway(true, handleClickAway);
    } else {
      listenforClickAway(false, handleClickAway);
    }
    return () => open && listenforClickAway(false, handleClickAway);
  }, [autofocus, handleClickAway, open]);

  useEffect(() => {
    if (anchorEl) {
      const { top, left, right, width, height } = anchorEl.getBoundingClientRect();
      setPosition({ top, left, right, width, height });
    }
  }, [anchorEl]);

  if (position === null || !open) {
    return null;
  }

  let { top, left, right, width: anchorWidth, height } = position;
  let width = widthProp === undefined || widthProp === 'anchor' ? anchorWidth : widthProp;

  //TODO if align is to right and we don't have a width or width is auto
  // we will have to measure after render to reposition accurately

  // This assumes width is < min-width
  if (align.endsWith('right') && typeof widthProp === 'number') {
    left = right - widthProp;
  } else if (align.endsWith('full-width')) {
    width = anchorEl.clientWidth;
  }

  return (
    <Portal x={left} y={top + height}>
      <div
        ref={forkedRootRef}
        className={cx(classBase, className)}
        style={{ ...style, width, height: listHeight }}>
        {dropdownHeader}
        {React.cloneElement(child, {
          ref: forkedContentRef,
          onCommit,
          onCancel
        })}
        {dropdownFooter}
      </div>
    </Portal>
  );
});

const equalsOrContains = (el, targetEl) => el && (el === targetEl || el.contains(targetEl));
