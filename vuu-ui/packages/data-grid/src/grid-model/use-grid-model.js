import { useCallback, useEffect, useReducer, useRef, useState } from "react";

import { useEffectSkipFirst } from "@vuu-ui/react-utils";
import useAdornments from "../use-adornments";
import modelReducer, { initModel } from "./grid-model-reducer";
import { ROW_HEIGHT } from "./grid-model-actions";
import { useResizeObserver, WidthHeight } from "@vuu-ui/react-utils";

const ClientWidthHeight = ["clientHeight", "clientWidth"];

const sizeOrUndefined = (value) =>
  value == null || value === "auto" ? undefined : value;

const useSize = (style, height, width) => {
  const [size, _setSize] = useState({
    height: sizeOrUndefined(style?.height ?? height),
    measuredHeight: null,
    width: sizeOrUndefined(style?.width ?? width),
    measuredWidth: null,
  });

  const setSize = useCallback(
    ({ height, width }) => {
      _setSize((state) => ({
        ...state,
        measuredHeight: height,
        measuredWidth: width,
      }));
    },
    [_setSize]
  );

  return [size, setSize];
};

export const useGridModel = ({
  dataSource: dataSourceProp,
  style,
  height,
  width,
  ...props
}) => {
  const rootRef = useRef(null);
  const firstRender = useRef(true);
  const [dataSource, setDataSource] = useState(dataSourceProp);

  const custom = useAdornments(props);

  const [size, setSize] = useSize(style, height, width);

  const onResize = useCallback(
    ({ clientWidth, clientHeight }) => {
      setSize({
        width: Math.floor(clientWidth),
        height: Math.floor(clientHeight),
      });
    },
    [setSize]
  );

  useResizeObserver(
    rootRef,
    ClientWidthHeight,
    onResize,
    /* reportInitialSize = */ true
  );

  const [gridModel, dispatchGridModel] = useReducer(
    modelReducer,
    [props, size, custom],
    initModel
  );

  useEffectSkipFirst(() => {
    dispatchGridModel({
      type: "resize",
      // The totalHeaderHeight will be set as top padding, which will not be included
      // in contentHeight measured by Observer
      height: size.measuredHeight,
      width: size.measuredWidth,
    });
  }, [size.measuredHeight, size.measuredWidth]);

  // useEffect(() => {
  //   onsole.log(`%cchange to columnGroups ${JSON.stringify(gridModel.columnGroups,null,2)}`,'color:brown;font-weight: bold;')
  // },[gridModel.columnGroups])

  useEffect(() => {
    if (firstRender.current) {
      if (props.rowHeight === undefined) {
        const rowHeight = parseInt(
          getComputedStyle(rootRef.current).getPropertyValue(
            "--grid-row-height"
          )
        );
        if (!isNaN(rowHeight) && rowHeight !== gridModel.rowHeight) {
          dispatchGridModel({ type: ROW_HEIGHT, rowHeight });
        }
      }
      firstRender.current = false;
    } else {
      // onsole.log(`dispatchGridModel rowHeight`)
      dispatchGridModel({ type: ROW_HEIGHT, rowHeight: props.rowHeight });
    }
  }, [props.rowHeight, gridModel.rowHeight]);

  //TODO do we need to useCallback here - can we ever send stale props ?
  useEffectSkipFirst(() => {
    // onsole.log(`dispatchGridModel initialize`)
    dispatchGridModel({ type: "initialize", props });
    if (dataSourceProp !== dataSource) {
      setDataSource(dataSourceProp);
    }
  }, [props.columns, props.columnSizing, dataSourceProp, props.groupBy]);

  return [rootRef, gridModel, dataSource, dispatchGridModel, custom];
};
