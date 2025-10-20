import { useSessionDataSource } from "@vuu-ui/vuu-data-react";
import { RefObject, SyntheticEvent, useCallback } from "react";
import { useLayoutProviderDispatch } from "../layout-provider/LayoutProvider";
import { DragStartAction } from "../layout-reducer";
import type {
  BroadcastMessageHandler,
  Contribution,
  ViewAction,
} from "../layout-view";
import { useViewBroadcastChannel } from "../layout-view/useViewBroadcastChannel";
import { usePersistentState } from "../use-persistent-state";
import { useViewContributions } from "./useViewContributions";
import { QueryResponse, ViewDispatch } from "./ViewContext";

export const useViewActionDispatcher = (
  id: string,
  rootRef: RefObject<HTMLDivElement | null>,
  viewPath?: string,
  dropTargets?: string[],
): [ViewDispatch, Contribution[] | undefined] => {
  const { purgeState } = usePersistentState();

  const { clearDataSource: clearDataSourceFromSessionState } =
    useSessionDataSource();

  const { clearContributions, contributions, updateContributions } =
    useViewContributions({ sessionKey: id });

  const dispatchLayoutAction = useLayoutProviderDispatch();

  // This assumes datasource has been stored in session state
  // we should extend to accommodate multiple dataSources
  const unsubscribeAndClearState = useCallback(() => {
    clearDataSourceFromSessionState(id, true);
    purgeState(id);
  }, [clearDataSourceFromSessionState, id, purgeState]);

  const handleRemove = useCallback(() => {
    unsubscribeAndClearState();
    dispatchLayoutAction({ type: "remove", path: viewPath });
  }, [unsubscribeAndClearState, dispatchLayoutAction, viewPath]);

  const handleMouseDown = useCallback(
    async (
      evt: MouseEvent,
      index: number,
      preDragActivity: unknown,
    ): Promise<boolean> => {
      evt.stopPropagation();
      const dragRect = rootRef.current?.getBoundingClientRect();
      return new Promise((resolve, reject) => {
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
    [rootRef, dispatchLayoutAction, viewPath, dropTargets],
  );

  const handleMessageReceived = useCallback<BroadcastMessageHandler>(
    (message) => {
      switch (message.type) {
        case "highlight-on":
          rootRef?.current?.classList.add("vuuHighlighted");
          break;
        case "highlight-off":
          rootRef?.current?.classList.remove("vuuHighlighted");
          break;
        case "layout-closed":
          unsubscribeAndClearState();
          break;
        default:
          console.log(`received ${message.type} message`);
      }
    },
    [rootRef, unsubscribeAndClearState],
  );

  const sendMessage = useViewBroadcastChannel(
    id,
    viewPath,
    handleMessageReceived,
  );

  const dispatchAction = useCallback(
    async <A extends ViewAction = ViewAction>(
      action: A,
      evt?: MouseEvent | SyntheticEvent,
    ): Promise<boolean | QueryResponse | void> => {
      const { type } = action;
      switch (type) {
        case "collapse":
        case "expand":
          return dispatchLayoutAction({ type, path: action.path ?? viewPath });
        case "remove":
          return handleRemove();
        case "mousedown":
          // TODO fix types
          return handleMouseDown(
            evt as MouseEvent,
            action.index as number,
            action.preDragActivity,
          );
        case "add-toolbar-contribution":
          return updateContributions(action.location, action.content);
        case "remove-toolbar-contribution":
          return clearContributions();
        case "query":
          return dispatchLayoutAction({
            type,
            path: action.path,
            query: action.query,
          });
        case "broadcast-message":
          sendMessage(action.message);
          break;

        default: {
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
      sendMessage,
    ],
  );

  return [dispatchAction, contributions];
};
