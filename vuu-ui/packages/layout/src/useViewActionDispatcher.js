import { useCallback, useState } from 'react';
import { Action } from './layout-action';

export const useViewActionDispatcher = (root, viewPath, layoutDispatch, dropTargets) => {
  const [contributions, setContributions] = useState([]);

  const handleMouseDown = useCallback(
    async (evt, index, preDragActivity) => {
      evt.stopPropagation();
      const dragRect = root.current.getBoundingClientRect();
      return new Promise((resolve, reject) => {
        // TODO should we check if we are allowed to drag ?
        layoutDispatch({
          type: Action.DRAG_START,
          evt,
          path: index === undefined ? viewPath : `${viewPath}.${index}`,
          dragRect,
          preDragActivity,
          dropTargets,
          resolveDragStart: resolve,
          rejectDragStart: reject
        });
      });
    },
    [root, layoutDispatch, viewPath, dropTargets]
  );

  // TODO should be event, action, then this method can bea assigned directly to a html element
  // as an event hander
  const dispatchAction = useCallback(
    async (action, evt) => {
      const { type, index, path = viewPath } = action;
      switch (type) {
        case Action.REMOVE:
        case Action.MINIMIZE:
        case Action.MAXIMIZE:
        case Action.RESTORE:
        case Action.TEAR_OUT:
          return layoutDispatch({ type, path });
        case 'mousedown':
          return handleMouseDown(evt, index, action.preDragActivity);
        case 'toolbar-contribution': {
          const { location, content } = action;
          return setContributions((state) => state.concat({ location, content }));
        }
        default: {
          if (Object.values(Action).includes(type)) {
            layoutDispatch(action);
          }
        }
      }
    },
    [handleMouseDown, layoutDispatch, viewPath]
  );

  return [dispatchAction, contributions];
};
