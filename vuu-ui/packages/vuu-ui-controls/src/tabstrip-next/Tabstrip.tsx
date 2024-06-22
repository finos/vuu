import { asReactElements, useId } from "@finos/vuu-utils";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import React, { useMemo, useRef } from "react";
import { TabProps, TabstripProps } from "./TabsTypes";
import { useTabstrip } from "./useTabstrip";
import { IconButton } from "../icon-button";

import tabstripCss from "./Tabstrip.css";
import draggableCss from "./Draggable.css";

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
  variant = "secondary",
  ...htmlAttributes
}: TabstripProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-tabstrip",
    css: tabstripCss,
    window: targetWindow,
  });
  useComponentCssInjection({
    testId: "vuu-draggable",
    css: draggableCss,
    window: targetWindow,
  });

  const rootRef = useRef<HTMLDivElement>(null);
  const {
    activeTabIndex,
    containerStyle,
    dragProps,
    focusVisible,
    onClickAddTab,
    interactedTabState,
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
  const className = cx(classBase, classNameProp);
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
            "data-index": index,
            "data-overflow-priority": selected ? "1" : undefined,
            draggable: allowDragDrop,
            editable,
            editing: interactedTabState?.index === index,
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
            <IconButton
              {...tabstripHook.navigationProps}
              aria-label="Create Tab"
              className={`${classBase}-addTabButton`}
              data-embedded
              icon="add"
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
      allowDragDrop,
      interactedTabState?.index,
      focusVisible,
      location,
    ]
  );

  return (
    <>
      <div
        {...htmlAttributes}
        {...tabstripHook.containerProps}
        {...dragProps}
        className={cx(
          className,
          `${classBase}-${variant}`,
          `vuuOrientation-${orientation}`
        )}
        id={id}
        ref={rootRef}
        style={style}
        role="tablist"
      >
        {tabs}
      </div>
    </>
  );
};
