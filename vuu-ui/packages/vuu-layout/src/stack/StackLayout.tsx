import { useIdMemo as useId } from "@salt-ds/core";
import React, { ReactElement, useRef } from "react";
import Component from "../Component";
import { useLayoutProviderDispatch } from "../layout-provider";
import { useViewActionDispatcher, View } from "../layout-view";
import { registerComponent } from "../registry/ComponentRegistry";
import { usePersistentState } from "../use-persistent-state";
import { Stack } from "./Stack";
import { StackProps } from "./stackTypes";

import "./Stack.css";

const defaultCreateNewChild = (index: number) => (
  <View
    resizeable
    title={`Tab ${index}`}
    style={{ flexGrow: 1, flexShrink: 0, flexBasis: 0 }}
    header
    closeable
  >
    <Component style={{ flex: 1 }} />
  </View>
);

export const StackLayout = (props: StackProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const dispatch = useLayoutProviderDispatch();
  const { loadState } = usePersistentState();

  const {
    createNewChild = defaultCreateNewChild,
    id: idProp,
    onTabSelectionChanged,
    path,
    ...restProps
  } = props;

  const { children } = props;

  const id = useId(idProp);

  const [dispatchViewAction] = useViewActionDispatcher(id, ref, path);

  const handleTabSelection = (nextIdx: number) => {
    console.log(`StackLayout handleTabSelection nextTab = ${nextIdx}`);
    if (path) {
      dispatch({ type: "switch-tab", path, nextIdx });
      onTabSelectionChanged?.(nextIdx);
    }
  };

  const handleTabClose = (tabIndex: number) => {
    if (Array.isArray(children)) {
      const {
        props: { "data-path": dataPath, path = dataPath },
      } = children[tabIndex];
      dispatch({ type: "remove", path });
    }
  };

  const handleTabAdd = (e: unknown, tabIndex = React.Children.count(children)) => {
    if (path) {
      console.log(`[StackLayout] handleTabAdd`);
      const component = createNewChild(tabIndex);
      console.log({ component });
      dispatch({
        type: "add",
        path,
        component,
      });
    }
  };

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

  const getTabLabel = (component: ReactElement, idx: number) => {
    const { id, title } = component.props;
    return loadState(id, "view-title") || title || `Tab ${idx + 1}`;
  };

  return (
    <Stack
      {...restProps}
      id={id}
      getTabLabel={getTabLabel}
      onMouseDown={handleMouseDown}
      onTabAdd={handleTabAdd}
      onTabClose={handleTabClose}
      onTabEdit={handleTabEdit}
      onTabSelectionChanged={handleTabSelection}
      ref={ref}
    />
  );
};
StackLayout.displayName = "Stack";

registerComponent("Stack", StackLayout, "container");
