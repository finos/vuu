import { asReactElements, OverflowContainer, useId } from "@finos/vuu-layout";
import { Button } from "@salt-ds/core";
import cx from "classnames";
import React, { useCallback, useMemo, useRef } from "react";
import { TabstripProps } from "./TabsTypes";
import { useTabstripNext } from "./useTabstripNext";

import "./Tabstrip.css";

const classBase = "vuuTabstrip";

export interface TabstripNextProps extends TabstripProps {
  activeTabIndex: number;
  animateSelectionThumb?: boolean;
}

export const TabstripNext = ({
  activeTabIndex: activeTabIndexProp,
  allowAddTab,
  allowCloseTab,
  allowRenameTab = false,
  animateSelectionThumb = false,
  children,
  className: classNameProp,
  id: idProp,
  keyBoardActivation = "manual",
  onActiveChange,
  onAddTab,
  onCloseTab,
  onExitEditMode,
  orientation = "horizontal",
  style: styleProp,
  ...htmlAttributes
}: TabstripNextProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const {
    activeTabIndex,
    focusVisible,
    containerStyle,
    tabProps,
    ...tabstripHook
  } = useTabstripNext({
    activeTabIndex: activeTabIndexProp,
    animateSelectionThumb,
    containerRef: rootRef,
    keyBoardActivation,
    onActiveChange,
    onCloseTab,
    onExitEditMode,
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

  const handleAddTabClick = useCallback(() => {
    onAddTab?.();
  }, [onAddTab]);

  const tabs = useMemo(
    () =>
      asReactElements(children)
        .map((child, index) => {
          const {
            id: tabId = `${id}-tab-${index}`,
            closeable = allowCloseTab,
            editable = allowRenameTab,
          } = child.props;
          const selected = index === activeTabIndex;
          return React.cloneElement(child, {
            ...tabProps,
            ...tabstripHook.navigationProps,
            closeable,
            "data-overflow-priority": selected ? "1" : undefined,
            editable,
            focusVisible: focusVisible === index,
            id: tabId,
            index,
            selected,
            tabIndex: selected ? 0 : -1,
          });
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
              onClick={handleAddTabClick}
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
      handleAddTabClick,
      id,
      tabProps,
      tabstripHook.navigationProps,
    ]
  );

  return (
    <OverflowContainer
      {...htmlAttributes}
      {...tabstripHook.containerProps}
      className={className}
      height={24}
      id={id}
      overflowIcon="more-horiz"
      ref={rootRef}
      style={style}
    >
      {tabs}
    </OverflowContainer>
  );
};
