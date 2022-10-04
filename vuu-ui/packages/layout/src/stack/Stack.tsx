import { useId } from "@vuu-ui/react-utils";
import React, {
  ForwardedRef,
  forwardRef,
  MouseEvent,
  ReactElement,
  ReactNode,
  useCallback,
} from "react";
import { Tab, Tabstrip, Toolbar, ToolbarField } from "@heswell/uitk-lab";
import { StackProps } from "./stackTypes";

import "./Stack.css";

const getDefaultTabLabel = (component: ReactElement, tabIndex: number) =>
  component.props?.title ?? `Tab ${tabIndex + 1}`;

const getChildElements = <T extends ReactElement = ReactElement>(
  children: ReactNode
): T[] => {
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
    keyBoardActivation = "manual",
    onMouseDown,
    onTabAdd,
    onTabClose,
    onTabEdit,
    onTabSelectionChanged,
    showTabs,
    style,
    toolbarContent,
  }: StackProps,
  ref: ForwardedRef<HTMLDivElement>
) {
  const id = useId(idProp);

  const handleTabSelection = (nextIdx: number) => {
    // if uncontrolled, handle it internally
    onTabSelectionChanged?.(nextIdx);
  };

  const handleTabClose = (tabIndex: number) => {
    // if uncontrolled, handle it internally
    onTabClose?.(tabIndex);
  };

  const handleAddTab = () => {
    // if uncontrolled, handle it internally
    onTabAdd?.(React.Children.count(children));
  };

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    // if uncontrolled, handle it internally
    const target = e.target as HTMLElement;
    const tabElement = target.closest('[role^="tab"]') as HTMLDivElement;
    const role = tabElement?.getAttribute("role");
    if (role === "tab") {
      const tabIndex = parseInt(tabElement.dataset.index ?? "-1");
      if (tabIndex !== -1) {
        onMouseDown?.(e, tabIndex);
      } else {
        throw Error("Stack: mousedown on tab with unknown index");
      }
    } else if (role === "tablist") {
      console.log(`Stack mousedown on tabstrip`);
    }
  };

  const handleTabEdit = (e: any, tabIndex: number, label: string) => {
    // if uncontrolled, handle it internally
    if (onTabEdit) {
      onTabEdit(e, tabIndex, label);
    }
  };

  const handleExitEditMode = useCallback(
    (
      oldText: string,
      newText: string,
      allowDeactivation: boolean,
      tabIndex: number
    ) => {
      console.log(`handleExitEditMode ${oldText} => ${newText} @ ${tabIndex}`);
    },
    []
  );

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
          closeable={closeable}
          editable={true}
          // onEdit={handleTabEdit}
        />
      );
    });

  const child = activeChild();

  return (
    <div className="Tabs" style={style} id={id} ref={ref}>
      {showTabs ? (
        <Toolbar
          className="vuuTabHeader vuuHeader"
          // onMouseDown={handleMouseDown}
        >
          <ToolbarField
            disableFocusRing
            data-collapsible="dynamic"
            data-priority="3"
          >
            <Tabstrip
              enableRenameTab
              enableAddTab={enableAddTab}
              enableCloseTab={enableCloseTabs}
              keyBoardActivation={keyBoardActivation}
              onActiveChange={handleTabSelection}
              onAddTab={handleAddTab}
              onCloseTab={handleTabClose}
              onExitEditMode={handleExitEditMode}
              onMouseDown={handleMouseDown}
              activeTabIndex={active || (child === null ? -1 : 0)}
            >
              {renderTabs()}
            </Tabstrip>
          </ToolbarField>
        </Toolbar>
      ) : null}
      {child}
    </div>
  );
});
Stack.displayName = "Stack";
