import { useEffect, useReducer, useRef, useState } from "react";
import { useAdornments } from "../grid-adornments";
import { useEffectSkipFirst } from "../utils";
import { ROW_HEIGHT } from "./gridModelActions";
import {
  GridModelReducer,
  gridModelReducer,
  initModel,
} from "./GridModelReducer";
import {
  GridModelHookProps,
  GridModelHookResult,
  GridModelReducerInitializerTuple,
} from "./gridModelTypes";
import { isMeasured, useMeasuredSize } from "./useMeasuredSize";

export const useGridModel = ({
  children,
  dataSource: dataSourceProp,
  style,
  height,
  width,
  ...props
}: GridModelHookProps): GridModelHookResult => {
  const rootRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);
  const [dataSource, setDataSource] = useState(dataSourceProp);
  const custom = useAdornments(children);
  const size = useMeasuredSize(rootRef, height, width);
  const [gridModel, dispatchGridModel] = useReducer<
    GridModelReducer,
    GridModelReducerInitializerTuple
  >(gridModelReducer, [props, size, custom], initModel);

  useEffect(() => {
    if (firstRender.current && rootRef.current) {
      if (typeof props.rowHeight === "number") {
        dispatchGridModel({ type: ROW_HEIGHT, rowHeight: props.rowHeight });
      } else {
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
    }
  }, [props.rowHeight, gridModel.rowHeight]);

  useEffect(() => {
    if (isMeasured(size)) {
      dispatchGridModel({
        size,
        type: "resize",
      });
    }
  }, [size]);

  //TODO do we need to useCallback here - can we ever send stale props ?
  useEffectSkipFirst(() => {
    // onsole.log(`dispatchGridModel initialize`)
    dispatchGridModel({ type: "initialize", props, size });
    if (dataSourceProp !== dataSource) {
      setDataSource(dataSourceProp);
    }
  }, [props.columns, props.columnSizing, dataSourceProp, props.groupBy]);

  return [rootRef, gridModel, dataSource, dispatchGridModel, custom];
};
