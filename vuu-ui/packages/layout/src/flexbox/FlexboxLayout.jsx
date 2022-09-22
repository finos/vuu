import React, { useCallback } from 'react';
import Flexbox from './Flexbox';
import { Action } from '../layout-action';
import { registerComponent } from '../registry/ComponentRegistry';
import { useLayoutProviderDispatch } from '../layout-provider';

export const FlexboxLayout = function FlexboxLayout(props) {
  const { path } = props;
  const dispatch = useLayoutProviderDispatch();

  const handleSplitterMoved = useCallback(
    (sizes) => {
      dispatch({
        type: Action.SPLITTER_RESIZE,
        path,
        sizes
      });
    },
    [dispatch, path]
  );

  return <Flexbox {...props} onSplitterMoved={handleSplitterMoved} />;
};
FlexboxLayout.displayName = 'Flexbox';

registerComponent('Flexbox', FlexboxLayout, 'container');
