import React, { useCallback } from 'react';
import Flexbox from './Flexbox';
import useLayout from '../useLayout';
import { LayoutContext } from '../layout-context';
import { Action } from '../layout-action';
import { registerComponent } from '../registry/ComponentRegistry';

const FlexboxLayout = function FlexboxLayout(inputProps) {
  const [props, ref, layoutDispatch, isRoot] = useLayout('Flexbox', inputProps);

  const { path } = props;

  const handleSplitterMoved = useCallback(
    (sizes) => {
      layoutDispatch({
        type: Action.SPLITTER_RESIZE,
        path,
        sizes
      });
    },
    [layoutDispatch, path]
  );

  return isRoot ? (
    <LayoutContext.Provider value={{ dispatch: layoutDispatch }}>
      <Flexbox {...props} ref={ref} onSplitterMoved={handleSplitterMoved} />
    </LayoutContext.Provider>
  ) : (
    <Flexbox {...props} ref={ref} onSplitterMoved={handleSplitterMoved} />
  );
};
FlexboxLayout.displayName = 'Flexbox';

export default FlexboxLayout;

registerComponent('Flexbox', FlexboxLayout, 'container');
