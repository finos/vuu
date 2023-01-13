import { useCallback } from "react";
import { Action } from "../layout-action";
import { useLayoutProviderDispatch } from "../layout-provider";
import { SplitterResizeAction } from "../layout-reducer";
import { registerComponent } from "../registry/ComponentRegistry";
import Flexbox from "./Flexbox";
import { FlexboxLayoutProps } from "./flexboxTypes";

export const FlexboxLayout = function FlexboxLayout(props: FlexboxLayoutProps) {
  const { path } = props;
  const dispatch = useLayoutProviderDispatch();

  const handleSplitterMoved = useCallback(
    (sizes) => {
      dispatch({
        type: Action.SPLITTER_RESIZE,
        path,
        sizes,
      } as SplitterResizeAction);
    },
    [dispatch, path]
  );

  return <Flexbox {...props} onSplitterMoved={handleSplitterMoved} />;
};
FlexboxLayout.displayName = "Flexbox";

registerComponent("Flexbox", FlexboxLayout, "container");
