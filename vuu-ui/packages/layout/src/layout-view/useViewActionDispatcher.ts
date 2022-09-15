import { ReactElement, RefObject, useCallback, useState } from 'react';
import { useLayoutProviderDispatch } from '../layout-provider';
import { DragStartAction } from '../layout-reducer';
import { ViewDispatch } from './ViewContext';
import { ViewAction } from './viewTypes';

export type Contribution = {
  index?: number;
  location?: any;
  content: ReactElement;
};

export const useViewActionDispatcher = (
  root: RefObject<HTMLDivElement>,
  viewPath?: string,
  dropTargets?: string[]
): [ViewDispatch, Contribution[] | undefined] => {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const dispatch = useLayoutProviderDispatch();

  const handleMouseDown = useCallback(
    async (evt, index, preDragActivity): Promise<boolean> => {
      evt.stopPropagation();
      const dragRect = root.current?.getBoundingClientRect();
      console.log('useViewActionDispatcher return prom,ise and forward action to layputProvider');
      return new Promise((resolve, reject) => {
        // TODO should we check if we are allowed to drag ?
        dispatch({
          type: 'drag-start',
          evt,
          path: index === undefined ? viewPath : `${viewPath}.${index}`,
          dragRect,
          preDragActivity,
          dropTargets,
          resolveDragStart: resolve,
          rejectDragStart: reject
        } as DragStartAction);
      });
    },
    [root, dispatch, viewPath, dropTargets]
  );

  // TODO should be event, action, then this method can bea assigned directly to a html element
  // as an event hander
  const dispatchAction = useCallback(
    async <A extends ViewAction = ViewAction>(action: A, evt: any): Promise<boolean | void> => {
      const { type } = action;
      switch (type) {
        case 'remove':
        case 'maximize':
        case 'minimize':
        case 'restore':
          // case Action.TEAR_OUT:
          return dispatch({ type, path: action.path ?? viewPath });
        case 'mousedown':
          console.log('2) ViewActionDispatch Hook dispatch Action mousedown');
          return handleMouseDown(evt, action.index, action.preDragActivity);
        case 'toolbar-contribution': {
          const { location, content } = action;
          return setContributions((state) => state.concat({ location, content }));
        }
        default: {
          // if (Object.values(Action).includes(type)) {
          //   dispatch(action);
          // }
          return undefined;
        }
      }
    },
    [handleMouseDown, dispatch, viewPath]
  );

  return [dispatchAction, contributions];
};
