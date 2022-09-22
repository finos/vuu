import { useId } from '@vuu-ui/react-utils';
import React, { ForwardedRef, forwardRef, isValidElement, ReactElement, ReactNode } from 'react';
import { Tab, Tabstrip } from '../tabstrip';
import { Toolbar } from '../toolbar';
import { StackProps } from './stackTypes';

import './Stack.css';

const getDefaultTabLabel = (component: ReactElement, tabIndex: number) =>
  component.props?.title ?? `Tab ${tabIndex + 1}`;

const getChildElements = <T extends ReactElement = ReactElement>(children: ReactNode): T[] => {
  const elements: T[] = [];
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child)) {
      elements.push(child as T);
    } else {
      console.warn(`Stack has unexpected child element type`);
    }
  });
  return elements;
};

export const Stack = forwardRef(function Stack(
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
  }: StackProps,
  ref: ForwardedRef<HTMLDivElement>
) {
  const id = useId(idProp);

  const handleTabSelection = (e: any, nextIdx: number) => {
    // if uncontrolled, handle it internally
    if (onTabSelectionChanged) {
      onTabSelectionChanged(e, nextIdx);
    }
  };

  const handleTabClose = (e: any, tabIndex: number) => {
    // if uncontrolled, handle it internally
    if (onTabClose) {
      onTabClose(e, tabIndex);
    }
  };

  const handleAddTab = (e: any, tabIndex = React.Children.count(children)) => {
    // if uncontrolled, handle it internally
    if (onTabAdd) {
      onTabAdd(e, tabIndex);
    }
  };

  const handleMouseDown = (e: any, tabIndex: number) => {
    // if uncontrolled, handle it internally
    if (onMouseDown) {
      onMouseDown(e, tabIndex);
    }
  };

  const handleTabEdit = (e: any, tabIndex: number, label: string) => {
    // if uncontrolled, handle it internally
    if (onTabEdit) {
      onTabEdit(e, tabIndex, label);
    }
  };

  const activeChild = () => {
    if (React.isValidElement(children)) {
      return children;
    } else if (Array.isArray(children)) {
      return children[active] ?? null;
    } else {
      return null;
    }
  };

  const renderTabs = () =>
    getChildElements(children).map((child, idx) => {
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
