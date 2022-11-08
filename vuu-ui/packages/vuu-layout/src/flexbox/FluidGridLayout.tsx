import React from 'react';
import {FluidGrid, FluidGridProps} from './FluidGrid';
import { registerComponent } from '../registry/ComponentRegistry';

export const FluidGridLayout = function FluidGridLayout(props: FluidGridProps) {
  return <FluidGrid {...props} />;
};
FluidGridLayout.displayName = 'FluidGrid';

registerComponent('FluidGrid', FluidGridLayout, 'container');
