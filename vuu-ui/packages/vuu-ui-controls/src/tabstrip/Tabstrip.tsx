import { asReactElements, OverflowContainer, useId } from "@finos/vuu-layout";
import { Button } from "@salt-ds/core";
import cx from "classnames";
import React, { useMemo, useRef } from "react";
import { TabProps, TabstripProps } from "./TabsTypes";
import { useTabstrip } from "./useTabstrip";

import "./Tabstrip.css";

const classBase = "vuuTabstrip";

export const Tabstrip = ({
  activeTabIndex: activeTabIndexProp,
  allowAddTab,
  allowCloseTab,
  allowDragDrop = false,
  allowRenameTab = false,
  animateSelectionThumb = false,
  children,
  className: classNameProp,
  id: idProp,
  keyBoardActivation = "manual",
  location,
  onActiveChange,
  onAddTab,
  onCloseTab,
  onExitEditMode,
  onMoveTab,
  orientation = "horizontal",
  showTabMenuButton,
  style: styleProp,
  tabClassName,
  ...htmlAttributes
}: TabstripProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const {
    activeTabIndex,
    focusVisible,
    containerStyle,
    draggedItemIndex,
    onClickAddTab,
    tabProps,
    ...tabstripHook
  } = useTabstrip({
    activeTabIndex: activeTabIndexProp,
    allowDragDrop,
    animateSelectionThumb,
    containerRef: rootRef,
    keyBoardActivation,
    onActiveChange,
    onAddTab,
    onCloseTab,
    onExitEditMode,
    onMoveTab,
    orientation,
  });
  const id = useId(idProp);
  const className = cx(classBase, `${classBase}-${orientation}`, classNameProp);
  const style =
    styleProp || containerStyle
      ? {
          ...styleProp,
          ...containerStyle,
        }
      : undefined;

  const tabs = useMemo(
    () =>
      asReactElements(children)
        .map((child, index) => {
          const {
            id: tabId = `${id}-tab-${index}`,
            className,
            closeable = allowCloseTab,
            editable = allowRenameTab,
            location: tabLocation,
            showMenuButton = showTabMenuButton,
          } = child.props;
          const selected = index === activeTabIndex;
          return React.cloneElement(child, {
            ...tabProps,
            ...tabstripHook.navigationProps,
            className: cx(className, tabClassName),
            closeable,
            "data-overflow-priority": selected ? "1" : undefined,
            dragging: draggedItemIndex === index,
            editable,
            focusVisible: focusVisible === index,
            id: tabId,
            index,
            key: index,
            location: cx(location, tabLocation),
            selected,
            showMenuButton,
            tabIndex: selected ? 0 : -1,
          } as Partial<TabProps>);
        })
        .concat(
          allowAddTab ? (
            <Button
              {...tabstripHook.navigationProps}
              aria-label="Create Tab"
              className={`${classBase}-addTabButton`}
              data-icon="add"
              data-overflow-priority="1"
              key="addButton"
              onClick={onClickAddTab}
              variant="secondary"
              tabIndex={-1}
            />
          ) : (
            []
          )
        ),
    [
      children,
      allowAddTab,
      tabstripHook.navigationProps,
      onClickAddTab,
      id,
      allowCloseTab,
      allowRenameTab,
      showTabMenuButton,
      activeTabIndex,
      tabProps,
      tabClassName,
      draggedItemIndex,
      focusVisible,
      location,
    ]
  );

  return (
    <>
      <OverflowContainer
        {...htmlAttributes}
        {...tabstripHook.containerProps}
        className={className}
        height={29}
        id={id}
        orientation={orientation}
        overflowIcon="more-horiz"
        ref={rootRef}
        style={style}
      >
        {tabs}
      </OverflowContainer>
      {tabstripHook.draggable}
    </>
  );
};
