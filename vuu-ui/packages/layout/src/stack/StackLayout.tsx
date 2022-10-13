import { useId } from "@vuu-ui/react-utils";
import React, { ReactElement, useRef } from "react";
import { Stack } from "./Stack";
// import { Tooltray } from "../toolbar";
// import { CloseButton, MinimizeButton, MaximizeButton } from "../action-buttons";
import Component from "../Component";
import { useLayoutProviderDispatch } from "../layout-provider";
import { useViewActionDispatcher, View } from "../layout-view";
import { registerComponent } from "../registry/ComponentRegistry";
import { usePersistentState } from "../use-persistent-state";
import { StackProps } from "./stackTypes";

import "./Stack.css";

const defaultCreateNewChild = (index: number) => (
  // Note make this width 100% and height 100% and we get a weird error where view continually resizes - growing
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
  const { loadState, saveState } = usePersistentState();

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

  const handleTabAdd = (e: any, tabIndex = React.Children.count(children)) => {
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

  const handleMouseDown = async (e: any, index: number) => {
    // If user drags the selected Tab, we need to select another Tab and re-render.
    // This needs to be co-ordinated with drag Tab within Tabstrip, whcih can
    // be handles within The Tabstrip until final release - much like Splitter
    // dragging in Flexbox.
    let readyToDrag: undefined | ((value: unknown) => void);

    // Experimental
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

  const handleTabEdit = (e: any, tabIndex: number, text: string) => {
    // Save into state on behalf of the associated View
    // Do we need a mechanism to get this into the JSPOMN when we serialize ?
    // const { id } = children[tabIndex].props;
    // saveState(id, 'view-title', text);
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
      // toolbarContent={
      //   <Tooltray data-align="right" className="layout-buttons">
      //     <MinimizeButton />
      //     <MaximizeButton />
      //     <CloseButton />
      // </Tooltray>
      // }
    />
  );
};
StackLayout.displayName = "Stack";

registerComponent("Stack", StackLayout, "container");
