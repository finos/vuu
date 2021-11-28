import React, { forwardRef } from 'react';
import { useId } from '@vuu-ui/react-utils';
import { Tab, Tabstrip } from '../tabstrip';
import { Toolbar } from '../toolbar';

import './Stack.css';

const getDefaultTabLabel = (component, tabIndex) => component.props?.title ?? `Tab ${tabIndex + 1}`;

const Stack = forwardRef(function Stack(
  {
    active = 0,
    children,
    enableAddTab,
    enableCloseTabs,
    getTabLabel = getDefaultTabLabel,
    id: idProp,
    keyBoardActivation = 'automatic',
    onMouseDown,
    onTabAdd,
    onTabClose,
    onTabEdit,
    onTabSelectionChanged,
    showTabs,
    style,
    toolbarContent
  },
  ref
) {
  const id = useId(idProp);

  const handleTabSelection = (e, nextIdx) => {
    // if uncontrolled, handle it internally
    if (onTabSelectionChanged) {
      onTabSelectionChanged(e, nextIdx);
    }
  };

  const handleTabClose = (e, tabIndex) => {
    // if uncontrolled, handle it internally
    if (onTabClose) {
      onTabClose(e, tabIndex);
    }
  };

  const handleAddTab = (e, tabIndex = React.Children.count(children)) => {
    // if uncontrolled, handle it internally
    if (onTabAdd) {
      onTabAdd(e, tabIndex);
    }
  };

  const handleMouseDown = (e, tabIndex) => {
    // if uncontrolled, handle it internally
    if (onMouseDown) {
      onMouseDown(e, tabIndex);
    }
  };

  const handleTabEdit = (e, tabIndex, label) => {
    // if uncontrolled, handle it internally
    if (onTabEdit) {
      onTabEdit(e, tabIndex, label);
    }
  };

  const activeChild = () => {
    if (React.isValidElement(children)) {
      return children;
    } else if (children.length > 0) {
      return children[active] ?? null;
    } else {
      return null;
    }
  };

  const renderTabs = () =>
    (React.isValidElement(children) ? [children] : children || []).map((child, idx) => {
      const rootId = `${id}-${idx}`;
      const { closeable, id: childId } = child.props;
      return (
        <Tab
          ariaControls={`${rootId}-tab`}
          draggable
          key={childId} // Important that we key by child identifier, not using index
          id={rootId}
          label={getTabLabel(child, idx)}
          deletable={closeable}
          editable={true}
          onEdit={handleTabEdit}
        />
      );
    });

  const child = activeChild();

  return (
    <div className="Tabs" style={style} id={id} ref={ref}>
      {showTabs ? (
        <Toolbar className="hwTabHeader hwHeader" maxRows={1} onMouseDown={handleMouseDown}>
          <Tabstrip
            enableAddTab={enableAddTab}
            enableCloseTabs={enableCloseTabs}
            keyBoardActivation={keyBoardActivation}
            onChange={handleTabSelection}
            onAddTab={handleAddTab}
            onDeleteTab={handleTabClose}
            onMouseDown={handleMouseDown}
            value={active || (child === null ? -1 : 0)}>
            {renderTabs()}
          </Tabstrip>
          {toolbarContent}
        </Toolbar>
      ) : null}
      {child}
    </div>
  );
});
Stack.displayName = 'Stack';

export default Stack;
