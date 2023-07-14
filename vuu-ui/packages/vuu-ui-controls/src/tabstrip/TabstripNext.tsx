import { TabstripProps } from "./TabsTypes";
import { Button, useIdMemo as useId } from "@salt-ds/core";

import { useTabstripNext } from "./useTabstripNext";
import cx from "classnames";
import { asReactElements, OverflowContainer } from "@finos/vuu-layout";

import "./Tabstrip.css";
import React, { useCallback, useMemo, useRef } from "react";

const classBase = "vuuTabstrip";

export interface TabstripNextProps extends TabstripProps {
  activeTabIndex: number;
  animateSelectionThumb: boolean;
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

  console.log(`TabstripNext focusVisible = ${focusVisible}`);

  const handleAddTabClick = useCallback(() => {
    console.log("add tab");
    // onAddTab?.();
  }, []);

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
      ref={rootRef}
      style={style}
    >
      {tabs}
    </OverflowContainer>
  );
};
