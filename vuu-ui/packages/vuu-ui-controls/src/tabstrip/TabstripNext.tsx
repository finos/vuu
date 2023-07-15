import { asReactElements, OverflowContainer, useId } from "@finos/vuu-layout";
import { Button } from "@salt-ds/core";
import cx from "classnames";
import { TabstripProps } from "./TabsTypes";
import { useTabstripNext } from "./useTabstripNext";

import React, { useCallback, useMemo, useRef } from "react";
import "./Tabstrip.css";

const classBase = "vuuTabstrip";

export interface TabstripNextProps extends TabstripProps {
  activeTabIndex: number;
  animateSelectionThumb?: boolean;
}

export const TabstripNext = ({
  activeTabIndex: activeTabIndexProp,
  animateSelectionThumb = false,
  children,
  className: classNameProp,
  enableAddTab,
  id: idProp,
  keyBoardActivation = "manual",
  onActiveChange,
  onAddTab,
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

  console.log(
    `TabstripNext activeTabIndexProp = ${activeTabIndexProp} activeTabIndex  =${activeTabIndex}`
  );

  const tabs = useMemo(
    () =>
      asReactElements(children)
        .map((child, index) => {
          const selected = index === activeTabIndex;
          const tabId = child.props.id ?? `${id}-tab-${index}`;
          return React.cloneElement(child, {
            ...tabProps,
            ...tabstripHook.navigationProps,
            "data-overflow-priority": selected ? "1" : undefined,
            focusVisible: focusVisible === index,
            id: tabId,
            index,
            selected,
            tabIndex: selected ? 0 : -1,
          });
        })
        .concat(
          enableAddTab ? (
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
      children,
      enableAddTab,
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
