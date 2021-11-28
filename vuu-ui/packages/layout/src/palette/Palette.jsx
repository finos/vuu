import React from 'react';
import cx from 'classnames';
import { uuid } from '@vuu-ui/utils';
import { List } from '@vuu-ui/ui-controls';
import { Action } from '../layout-action';
import { registerComponent } from '../registry/ComponentRegistry';
import View from '../View';
import { useLayoutContext } from '../layout-context';

import './Palette.css';

// All props are spread to the View
export const PaletteItem = (props) => props.children;

const ComponentIcon = ({
  // eslint-disable-next-line no-unused-vars
  className,
  // eslint-disable-next-line no-unused-vars
  component,
  idx,
  text,
  onMouseDown,
  ...props
}) => {
  const handleMouseDown = (evt) => onMouseDown(evt, idx);
  return (
    <div className="hwComponentIcon hwListItem" onMouseDown={handleMouseDown} {...props}>
      <span>{text}</span>
    </div>
  );
};

const Palette = ({
  children,
  className,
  orientation = 'horizontal',
  selection = 'none',
  ...props
}) => {
  const { dispatch } = useLayoutContext();
  const classBase = 'hwPalette';

  function handleMouseDown(evt, idx) {
    // eslint-disable-next-line no-unused-vars
    const {
      props: { caption, children: payload, template, ...props }
    } = children[idx];
    const { left, top, width } = evt.currentTarget.getBoundingClientRect();
    const id = uuid();
    const identifiers = { id, key: id };
    const component = template ? (
      payload
    ) : (
      <View {...identifiers} {...props} title={props.label}>
        {payload}
      </View>
    );

    dispatch({
      type: Action.DRAG_START,
      evt,
      path: '*',
      component,
      instructions: {
        DoNotRemove: true,
        DoNotTransform: true,
        RemoveDraggableOnDragEnd: true,
        dragThreshold: 10
      },
      dragRect: {
        left,
        top,
        right: left + width,
        bottom: top + 150,
        width,
        height: 100
      }
    });
  }

  return (
    <List
      {...props}
      className={cx(classBase, className, `${classBase}-${orientation}`)}
      selection={selection}>
      {children.map((child, idx) =>
        child.type === PaletteItem ? (
          <ComponentIcon
            key={idx}
            idx={idx}
            text={child.props.caption || child.props.label}
            component={child}
            onMouseDown={handleMouseDown}></ComponentIcon>
        ) : (
          child
        )
      )}
    </List>
  );
};

export default Palette;

registerComponent('Palette', Palette, 'view');
