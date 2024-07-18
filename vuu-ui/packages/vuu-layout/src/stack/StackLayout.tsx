import { registerComponent, useId } from "@finos/vuu-utils";
import React, { useCallback, useRef } from "react";
import {
  useLayoutCreateNewChild,
  useLayoutProviderDispatch,
} from "../layout-provider";
import { getDefaultTabLabel } from "../layout-reducer";
import { useViewActionDispatcher } from "../layout-view-actions";
import { Placeholder } from "../placeholder";
import { usePersistentState } from "../use-persistent-state";
import { Stack } from "./Stack";
import { StackProps, TabLabelFactory } from "./stackTypes";
import { useViewBroadcastChannel } from "../layout-view";

const defaultCreateNewChild = () => (
  <Placeholder
    resizeable
    style={{ flexGrow: 1, flexShrink: 0, flexBasis: 0 }}
  />
);

export const StackLayout = (props: StackProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const dispatch = useLayoutProviderDispatch();
  const { loadState } = usePersistentState();

  const {
    createNewChild: createNewChildProp,
    id: idProp,
    onTabSelectionChanged,
    path,
    ...restProps
  } = props;

  const { children } = props;

  const id = useId(idProp);

  const sendMessage = useViewBroadcastChannel();

  const [dispatchViewAction] = useViewActionDispatcher(id, rootRef, path);
  const createNewChildFromContext = useLayoutCreateNewChild();
  const createNewChild =
    createNewChildProp ?? createNewChildFromContext ?? defaultCreateNewChild;

  const handleTabSelection = (nextIdx: number) => {
    if (path) {
      dispatch({ type: "switch-tab", id, path, nextIdx });
      onTabSelectionChanged?.(nextIdx);
    }
  };

  const handleTabClose = useCallback(
    (tabIndex: number) => {
      if (Array.isArray(children)) {
        const {
          props: { "data-path": dataPath, path = dataPath },
        } = children[tabIndex];
        sendMessage({ type: "layout-closed", path });
        setTimeout(() => {
          dispatch({ type: "remove", path });
        }, 100);
      }
    },
    [children, dispatch, sendMessage]
  );

  const handleTabAdd = useCallback(() => {
    if (path) {
      const tabIndex = React.Children.count(children);
      const component = createNewChild(tabIndex);
      dispatch({
        type: "add",
        path,
        component,
      });
    }
  }, [children, createNewChild, dispatch, path]);

  const handleMoveTab = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (path) {
        dispatch({
          fromIndex,
          toIndex,
          path,
          type: "move-child",
        });
      }
    },
    [dispatch, path]
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMouseDown = async (e: any, index: number) => {
    let readyToDrag: undefined | ((value: unknown) => void);

    const preDragActivity = async () =>
      new Promise((resolve) => {
        console.log("preDragActivity: Ok, gonna release the drag");
        readyToDrag = resolve;
      });

    const dragging = await dispatchViewAction(
      { type: "mousedown", index, preDragActivity },
      e
    );

    if (dragging) {
      readyToDrag?.(undefined);
    }
  };

  const handleTabEdit = (tabIndex: number, text: string) => {
    dispatch({ type: "set-title", path: `${path}.${tabIndex}`, title: text });
  };

  const getTabLabel: TabLabelFactory = (component, idx, existingLabels) => {
    const { id, title } = component.props;
    return (
      loadState(id, "view-title") ||
      title ||
      // This will normally never be called as title is always assigned in layout model
      getDefaultTabLabel(component, idx, existingLabels)
    );
  };

  return (
    <Stack
      {...restProps}
      id={id}
      getTabLabel={getTabLabel}
      onMouseDown={handleMouseDown}
      onMoveTab={handleMoveTab}
      onAddTab={handleTabAdd}
      onTabClose={handleTabClose}
      onTabEdit={handleTabEdit}
      onTabSelectionChanged={handleTabSelection}
      ref={rootRef}
    />
  );
};
StackLayout.displayName = "Stack";

registerComponent("Stack", StackLayout, "container");
