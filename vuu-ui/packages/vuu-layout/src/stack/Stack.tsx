import { useIdMemo as useId } from "@salt-ds/core";
import cx from "classnames";
import { Tab, Tabstrip, Toolbar, ToolbarField } from "@heswell/salt-lab";
import React, {
  ForwardedRef,
  forwardRef,
  MouseEvent,
  ReactElement,
  ReactNode,
  useCallback,
} from "react";
import { StackProps } from "./stackTypes";

import "./Stack.css";

const classBase = "Tabs";

const getDefaultTabIcon = (component: ReactElement, tabIndex: number) =>
  undefined;

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
    className: classNameProp,
    enableAddTab,
    enableCloseTabs,
    getTabIcon = getDefaultTabIcon,
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
    TabstripProps,
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
      const tabIndex = parseInt(tabElement.dataset.idx ?? "-1");
      if (tabIndex !== -1) {
        onMouseDown?.(e, tabIndex);
      } else {
        throw Error("Stack: mousedown on tab with unknown index");
      }
    } else if (role === "tablist") {
      console.log(`Stack mousedown on tabstrip`);
    }
  };

  const handleExitEditMode = useCallback(
    (
      _oldText: string,
      newText: string,
      _allowDeactivation: boolean,
      tabIndex: number
    ) => {
      onTabEdit?.(tabIndex, newText);
    },
    [onTabEdit]
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
          data-icon={getTabIcon(child, idx)}
          draggable
          key={childId ?? idx} // Important that we key by child identifier, not using index
          id={rootId}
          label={getTabLabel(child, idx)}
          closeable={closeable}
          editable={TabstripProps?.enableRenameTab !== false}
          // onEdit={handleTabEdit}
        />
      );
    });

  const child = activeChild();

  return (
    <div
      className={cx(classBase, classNameProp, {
        [`${classBase}-horizontal`]: TabstripProps?.orientation === "vertical",
      })}
      style={style}
      id={id}
      ref={ref}
    >
      {showTabs ? (
        <Toolbar
          className="vuuTabHeader vuuHeader"
          orientation={TabstripProps?.orientation}
          // onMouseDown={handleMouseDown}
        >
          <ToolbarField
            disableFocusRing
            data-collapsible="dynamic"
            data-priority="3"
            style={{ alignSelf: "flex-end" }}
          >
            <Tabstrip
              {...TabstripProps}
              enableRenameTab={TabstripProps?.enableRenameTab !== false}
              enableAddTab={enableAddTab}
              enableCloseTab={enableCloseTabs}
              keyBoardActivation={keyBoardActivation}
              onActiveChange={handleTabSelection}
              onAddTab={handleAddTab}
              onCloseTab={handleTabClose}
              onExitEditMode={handleExitEditMode}
              onMouseDown={handleMouseDown}
              activeTabIndex={
                TabstripProps?.activeTabIndex ?? (child === null ? -1 : active)
              }
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
