import { useCallback, useContext, useRef } from 'react';
import { useResizeObserver } from '@vuu-ui/react-utils';
import { ROW_HEIGHT } from './grid-model/grid-model-actions';
import GridContext from './grid-context';

const dimensions = ['height'];

export const useRowHeight = () => {
  const { dispatchGridModelAction } = useContext(GridContext);
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
