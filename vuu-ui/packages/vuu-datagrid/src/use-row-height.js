import { useCallback, useContext, useRef } from "react";
import { useResizeObserver } from "./utils";
import { ROW_HEIGHT } from "./grid-model/gridModelActions";
import { useGridContext } from "./grid-context";

const dimensions = ["height"];

export const useRowHeight = () => {
  const { dispatchGridModelAction } = useGridContext();
  const ref = useRef();

  const onResize = useCallback(
    ({ height }) => {
      dispatchGridModelAction({ type: ROW_HEIGHT, rowHeight: height });
    },
    [dispatchGridModelAction]
  );

  // useLayoutEffect(() =>{
  //   const {height} = ref.current.getBoundingClientRect();
  // },[]);

  useResizeObserver(ref, dimensions, onResize);

  return ref;
};
