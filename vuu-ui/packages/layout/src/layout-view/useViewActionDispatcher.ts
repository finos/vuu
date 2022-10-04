import {
  ReactElement,
  RefObject,
  SyntheticEvent,
  useCallback,
  useState,
} from "react";
import { useLayoutProviderDispatch } from "../layout-provider";
import { DragStartAction } from "../layout-reducer";
import { ViewDispatch } from "./ViewContext";
import { ViewAction } from "./viewTypes";
import { usePersistentState } from "../use-persistent-state";

export type Contribution = {
  index?: number;
  location?: any;
  content: ReactElement;
};

export const useViewActionDispatcher = (
  id: string,
  root: RefObject<HTMLDivElement>,
  viewPath?: string,
  dropTargets?: string[]
): [ViewDispatch, Contribution[] | undefined] => {
  const { purgeSessionState, loadSessionState, saveSessionState } =
    usePersistentState();
  const [contributions, setContributions] = useState<Contribution[]>(
    loadSessionState(id, "contributions") ?? []
  );
  const dispatch = useLayoutProviderDispatch();

  const updateContributions = useCallback(
    (location: string, content?: ReactElement) => {
      const updatedContributions = contributions.concat({ location, content });
      saveSessionState(id, "contributions", updatedContributions);
      setContributions(updatedContributions);
    },
    [contributions]
  );

  const clearContributions = useCallback(() => {
    purgeSessionState(id, "contributions");
    setContributions([]);
  }, [purgeSessionState]);

  const handleMouseDown = useCallback(
    async (evt, index, preDragActivity): Promise<boolean> => {
      evt.stopPropagation();
      const dragRect = root.current?.getBoundingClientRect();
      return new Promise((resolve, reject) => {
        // TODO should we check if we are allowed to drag ?
        dispatch({
          type: "drag-start",
          evt,
          path: index === undefined ? viewPath : `${viewPath}.${index}`,
          dragRect,
          preDragActivity,
          dropTargets,
          resolveDragStart: resolve,
          rejectDragStart: reject,
        } as DragStartAction);
      });
    },
    [root, dispatch, viewPath, dropTargets]
  );

  // TODO should be event, action, then this method can bea assigned directly to a html element
  // as an event hander
  const dispatchAction = useCallback(
    async <A extends ViewAction = ViewAction>(
      action: A,
      evt?: SyntheticEvent
    ): Promise<boolean | void> => {
      const { type } = action;
      switch (type) {
        case "remove":
        case "maximize":
        case "minimize":
        case "restore":
          // case Action.TEAR_OUT:
          return dispatch({ type, path: action.path ?? viewPath });
        case "mousedown":
          console.log("2) ViewActionDispatch Hook dispatch Action mousedown");
          return handleMouseDown(evt, action.index, action.preDragActivity);
        case "add-toolbar-contribution":
          return updateContributions(action.location, action.content);
        case "remove-toolbar-contribution":
          return clearContributions();
        default: {
          // if (Object.values(Action).includes(type)) {
          //   dispatch(action);
          // }
          return undefined;
        }
      }
    },
    [handleMouseDown, dispatch, updateContributions, viewPath]
  );

  return [dispatchAction, contributions];
};
