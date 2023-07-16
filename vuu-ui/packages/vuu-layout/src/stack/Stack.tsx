import { Tab, TabstripNext as Tabstrip } from "@finos/vuu-ui-controls";
import { useIdMemo as useId } from "@salt-ds/core";
import cx from "classnames";
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

const getDefaultTabIcon = () => undefined;

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
    onTabSelectionChanged?.(nextIdx);
  };

  const handleTabClose = (tabIndex: number) => {
    onTabClose?.(tabIndex);
  };

  const handleAddTab = () => {
    onTabAdd?.(React.Children.count(children));
  };

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const tabElement = target.closest('[role^="tab"]') as HTMLDivElement;
    const role = tabElement?.getAttribute("role");
    if (role === "tab") {
      const tabIndex = parseInt(tabElement.dataset.idx ?? "-1");
      if (tabIndex === -1) {
        throw Error("Stack: mousedown on tab with unknown index");
      }
      onMouseDown?.(e, tabIndex);
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
    }
    if (Array.isArray(children)) {
      return children[active] ?? null;
    }
    return null;
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
          key={childId ?? idx}
          id={rootId}
          label={getTabLabel(child, idx)}
          closeable={closeable && TabstripProps?.enableCloseTab !== false}
          editable={TabstripProps?.enableRenameTab !== false}
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
        <Tabstrip
          {...TabstripProps}
          activeTabIndex={
            TabstripProps?.activeTabIndex ?? (child === null ? -1 : active)
          }
          allowRenameTab={TabstripProps?.enableRenameTab !== false}
          allowAddTab={enableAddTab}
          allowCloseTab={enableCloseTabs}
          animateSelectionThumb
          className="vuuTabHeader"
          keyBoardActivation={keyBoardActivation}
          onActiveChange={handleTabSelection}
          onAddTab={handleAddTab}
          onCloseTab={handleTabClose}
          onExitEditMode={handleExitEditMode}
          onMouseDown={handleMouseDown}
        >
          {renderTabs()}
        </Tabstrip>
      ) : null}
      {child}
    </div>
  );
});
Stack.displayName = "Stack";
