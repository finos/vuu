import { useId } from "@finos/vuu-layout";
import {
  getElementIndex,
  Tab,
  TabstripNext as Tabstrip,
  TabstripNextProps,
} from "@finos/vuu-ui-controls";
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

const DefaultTabstripProps: Partial<TabstripNextProps> = {
  allowAddTab: false,
  allowCloseTab: false,
  allowRenameTab: false,
};

export const Stack = forwardRef(function Stack(
  {
    active = 0,
    children,
    className: classNameProp,
    getTabIcon = getDefaultTabIcon,
    getTabLabel = getDefaultTabLabel,
    id: idProp,
    keyBoardActivation = "manual",
    // onMouseDown,
    onAddTab,
    onTabClose,
    onTabEdit,
    onTabSelectionChanged,
    showTabs = true,
    style,
    TabstripProps = DefaultTabstripProps,
  }: StackProps,
  ref: ForwardedRef<HTMLDivElement>
) {
  const id = useId(idProp);

  const { allowCloseTab, allowRenameTab } = TabstripProps;

  // TODO integrate with Tabstrip drag drop
  // const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
  //   const target = e.target as HTMLElement;
  //   const indexedElement = target.closest("[data-index]") as HTMLDivElement;
  //   const isTab = indexedElement?.querySelector(".vuuTab");
  //   if (isTab) {
  //     const index = getElementIndex(indexedElement);
  //     console.log(`index = ${index}`);
  //     onMouseDown?.(e, index);
  //   }
  // };

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
      const { closeable = allowCloseTab, id: childId } = child.props;
      return (
        <Tab
          ariaControls={`${rootId}-tab`}
          data-icon={getTabIcon(child, idx)}
          draggable
          key={childId ?? idx}
          id={rootId}
          label={getTabLabel(child, idx)}
          closeable={closeable}
          editable={allowRenameTab}
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
          animateSelectionThumb
          className="vuuTabHeader"
          keyBoardActivation={keyBoardActivation}
          onActiveChange={onTabSelectionChanged}
          onAddTab={onAddTab}
          onCloseTab={onTabClose}
          onExitEditMode={handleExitEditMode}
          // onMouseDown={handleMouseDown}
        >
          {renderTabs()}
        </Tabstrip>
      ) : null}
      {child}
    </div>
  );
});
Stack.displayName = "Stack";
