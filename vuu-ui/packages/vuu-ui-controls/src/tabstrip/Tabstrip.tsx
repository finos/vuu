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
  ...htmlAttributes
}: TabstripProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const {
    activeTabIndex,
    focusVisible,
    containerStyle,
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
            closeable = allowCloseTab,
            editable = allowRenameTab,
            showMenuButton = showTabMenuButton,
          } = child.props;
          const selected = index === activeTabIndex;
          return React.cloneElement(child, {
            ...tabProps,
            ...tabstripHook.navigationProps,
            closeable,
            "data-overflow-priority": selected ? "1" : undefined,
            dragging: tabstripHook.draggedItemIndex === index,
            editable,
            focusVisible: focusVisible === index,
            id: tabId,
            index,
            location,
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
      activeTabIndex,
      allowAddTab,
      allowCloseTab,
      allowRenameTab,
      children,
      focusVisible,
      id,
      location,
      onClickAddTab,
      showTabMenuButton,
      tabProps,
      tabstripHook.draggedItemIndex,
      tabstripHook.navigationProps,
    ]
  );

  return (
    <>
      <OverflowContainer
        {...htmlAttributes}
        {...tabstripHook.containerProps}
        className={className}
        height={28}
        id={id}
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
