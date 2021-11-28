import React from 'react';
import Stack from './Stack';
// import { Tooltray } from "../toolbar";
// import { CloseButton, MinimizeButton, MaximizeButton } from "../action-buttons";
import useLayout from '../useLayout';
import { LayoutContext } from '../layout-context';
import { Action } from '../layout-action';
import View from '../View';
import Component from '../Component';
import { useViewActionDispatcher } from '../useViewActionDispatcher';
import { registerComponent } from '../registry/ComponentRegistry';
import usePersistentState from '../use-persistent-state';

import './Stack.css';

const defaultCreateNewChild = (index) => (
  // Note make this width 100% and height 100% and we get a weird error where view continually resizes - growing
  <View
    resizeable
    title={`Tab ${index}`}
    style={{ flexGrow: 1, flexShrink: 0, flexBasis: 0 }}
    header
    closeable>
    <Component style={{ flex: 1 }} />
  </View>
);

const StackLayout = (inputProps) => {
  const [props, ref, layoutDispatch, isRoot] = useLayout('Stack', inputProps);
  const { loadState, saveState } = usePersistentState();

  const {
    createNewChild = defaultCreateNewChild,
    onTabSelectionChanged,
    path,
    ...restProps
  } = props;

  const { children } = props;

  const [dispatchViewAction] = useViewActionDispatcher(ref, path, layoutDispatch);

  const handleTabSelection = (e, nextIdx) => {
    layoutDispatch({ type: Action.SWITCH_TAB, path, nextIdx });
    if (onTabSelectionChanged) {
      onTabSelectionChanged(e, nextIdx);
    }
  };

  const handleTabClose = (e, tabIndex) => {
    const {
      props: { 'data-path': dataPath, path = dataPath }
    } = children[tabIndex];
    layoutDispatch({ type: Action.REMOVE, path });
  };

  const handleTabAdd = (e, tabIndex = React.Children.count(children)) => {
    const component = createNewChild(tabIndex);
    layoutDispatch({
      type: Action.ADD,
      path,
      component
    });
  };

  const handleMouseDown = async (e, index) => {
    // If user drags the selected Tab, we need to select another Tab and re-render.
    // This needs to be co-ordinated with drag Tab within Tabstrip, whcih can
    // be handles within The Tabstrip until final release - much like Splitter
    // dragging in Flexbox.
    let readyToDrag;

    // Experimental
    const preDragActivity = async () =>
      new Promise((resolve) => {
        console.log('Ok, gonna release the drag');
        readyToDrag = resolve;
      });

    const dragging = await dispatchViewAction({ type: 'mousedown', index, preDragActivity }, e);

    if (dragging) {
      readyToDrag();
    }
  };

  const handleTabEdit = (e, tabIndex, text) => {
    // Save into state on behalf of the associated View
    // Do we need a mechanism to get this into the JSPOMN when we serialize ?
    // const { id } = children[tabIndex].props;
    // saveState(id, 'view-title', text);
    layoutDispatch({ type: 'set-title', path: `${path}.${tabIndex}`, title: text });
  };

  const getTabLabel = (component, idx) => {
    const { id, title } = component.props;
    return loadState(id, 'view-title') || title || `Tab ${idx + 1}`;
  };

  const stack = (
    <Stack
      {...restProps}
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

  return isRoot ? (
    <LayoutContext.Provider value={{ dispatch: dispatchViewAction }}>
      {stack}
    </LayoutContext.Provider>
  ) : (
    stack
  );
};
StackLayout.displayName = 'Stack';

export default StackLayout;

registerComponent('Stack', StackLayout, 'container');
