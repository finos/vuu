import React from 'react';
import cx from 'classnames';
import useLayout from '../useLayout';
import Drawer from './Drawer';
import { partition } from '@vuu-ui/utils';
import { registerComponent } from '../registry/ComponentRegistry';

import './Chest.css';

const isDrawer = (component) => component.type === Drawer;
const isVertical = ({ props: { position = 'left' } }) => position.match(/top|bottom/);

const Chest = (inputProps) => {
  const [props, ref] = useLayout('Chest', inputProps);
  const { children, className: classNameProp, id, style } = props;
  const classBase = 'hwChest';
  const [drawers, content] = partition(children, isDrawer);
  const [verticalDrawers, horizontalDrawers] = partition(drawers, isVertical);
  const orientation =
    verticalDrawers.length === 0
      ? 'horizontal'
      : horizontalDrawers.length === 0
      ? 'vertical'
      : 'both';

  const className = cx(classBase, classNameProp, `${classBase}-${orientation}`);

  return (
    <div className={className} id={id} ref={ref} style={style}>
      {drawers}
      <div className={`${classBase}-content`}>{content}</div>
    </div>
  );
};
Chest.displayName = 'Chest';

export default Chest;

registerComponent('Chest', Chest, 'container');
