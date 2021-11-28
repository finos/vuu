import React from 'react';
import FluidGrid from './FluidGrid';
import useLayout from '../useLayout';
import { LayoutContext } from '../layout-context';
import { registerComponent } from '../registry/ComponentRegistry';

const FluidGridLayout = function FlexboxLayout(inputProps) {
  const [props, ref, layoutDispatch, isRoot] = useLayout('FluidGrid', inputProps);
  return isRoot ? (
    <LayoutContext.Provider value={{ dispatch: layoutDispatch }}>
      <FluidGrid {...props} ref={ref} />
    </LayoutContext.Provider>
  ) : (
    <FluidGrid {...props} ref={ref} />
  );
};
FluidGridLayout.displayName = 'FluidGrid';

export default FluidGridLayout;

registerComponent('FluidGrid', FluidGridLayout, 'container');
