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
import { DataSource } from "@vuu-ui/vuu-data";

export type Contribution = {
  index?: number;
  location?: string;
  content: ReactElement;
};

export const useViewActionDispatcher = (
  id: string,
  root: RefObject<HTMLDivElement>,
  viewPath?: string,
  dropTargets?: string[]
): [ViewDispatch, Contribution[] | undefined] => {
  const { loadSessionState, purgeSessionState, purgeState, saveSessionState } =
    usePersistentState();

  const [contributions, setContributions] = useState<Contribution[]>(
    loadSessionState(id, "contributions") ?? []
  );
  const dispatchLayoutAction = useLayoutProviderDispatch();
  const updateContributions = useCallback(
    (location: string, content: ReactElement) => {
      const updatedContributions = contributions.concat([
        { location, content },
      ]);
      saveSessionState(id, "contributions", updatedContributions);
      setContributions(updatedContributions);
    },
    [contributions, id, saveSessionState]
  );

  const clearContributions = useCallback(() => {
    purgeSessionState(id, "contributions");
    setContributions([]);
  }, [id, purgeSessionState]);

  const handleRemove = useCallback(() => {
    // TODO this requires a bit more thought. I works BECAUSE filteredGrid has
    // stored its datasource in sessionState. It is highly pretty much a
    // requirement for features to do so - how do we enforce it.
    const ds = loadSessionState(id, "data-source") as DataSource;
    if (ds) {
      ds.unsubscribe();
    }
    purgeSessionState(id);
    purgeState(id);
    dispatchLayoutAction({ type: "remove", path: viewPath });
  }, [
    dispatchLayoutAction,
    id,
    loadSessionState,
    purgeSessionState,
    purgeState,
    viewPath,
  ]);

  const handleMouseDown = useCallback(
    async (evt, index, preDragActivity): Promise<boolean> => {
      evt.stopPropagation();
      const dragRect = root.current?.getBoundingClientRect();
      return new Promise((resolve, reject) => {
        // TODO should we check if we are allowed to drag ?
        dispatchLayoutAction({
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
    [root, dispatchLayoutAction, viewPath, dropTargets]
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
        case "maximize":
        case "minimize":
        case "restore":
          // case Action.TEAR_OUT:
          return dispatchLayoutAction({ type, path: action.path ?? viewPath });
        case "remove":
          return handleRemove();
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
    [
      dispatchLayoutAction,
      viewPath,
      handleRemove,
      handleMouseDown,
      updateContributions,
      clearContributions,
    ]
  );

  return [dispatchAction, contributions];
};
