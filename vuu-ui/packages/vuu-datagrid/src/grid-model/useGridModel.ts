import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useAdornments } from "../grid-adornments";
import { useEffectSkipFirst, useResizeObserver, ResizeHandler } from "../utils";
import { ROW_HEIGHT } from "./gridModelActions";
import { GridModelReducer, initModel } from "./GridModelReducer";
import { GridModelHookProps, GridModelHookResult } from "./gridModelTypes";
import { useSize } from "./useSize";

const ClientWidthHeight = ["clientHeight", "clientWidth"];

export const useGridModel = ({
  children,
  dataSource: dataSourceProp,
  style,
  height,
  width,
  ...props
}: GridModelHookProps): GridModelHookResult => {
  const rootRef = useRef(null);
  const firstRender = useRef(true);
  const [dataSource, setDataSource] = useState(dataSourceProp);

  const custom = useAdornments(children);

  const [size, setSize] = useSize(style, height, width);

  const onResize: ResizeHandler = useCallback(
    ({
      clientWidth,
      clientHeight,
    }: {
      clientWidth?: number;
      clientHeight?: number;
    }) => {
      // Note: we know here that these values will be returned as numbers, we can enforce
      // this by typing useResizeObserver with generics
      if (typeof clientWidth === "number" && typeof clientHeight === "number") {
        setSize({
          width: Math.floor(clientWidth),
          height: Math.floor(clientHeight),
        });
      }
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
    GridModelReducer,
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
    if (firstRender.current && rootRef.current) {
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
