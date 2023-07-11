import { TabstripProps } from "./TabsTypes";
import { Button, useIdMemo as useId } from "@salt-ds/core";

import { useTabstripNext } from "./useTabstripNext";
import cx from "classnames";
import { asReactElements, OverflowContainer } from "@finos/vuu-layout";
import { TabActivationIndicator } from "./TabActivationIndicator";

import "./Tabstrip.css";
import React, { useCallback, useMemo, useRef } from "react";

const classBase = "vuuTabstrip";

export interface TabstripNextProps extends TabstripProps {
  activeTabIndex: number;
}

export const TabstripNext = ({
  activeTabIndex: activeTabIndexProp,
  children,
  className: classNameProp,
  enableAddTab,
  id: idProp,
  keyBoardActivation = "manual",
  onActiveChange,
  onAddTab,
  orientation = "horizontal",
  showActivationIndicator = true,
  ...htmlAttributes
}: TabstripNextProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const { activeTabIndex, focusVisible, tabProps, ...tabstripHook } =
    useTabstripNext({
      activeTabIndex: activeTabIndexProp,
      containerRef: rootRef,
      keyBoardActivation,
      onActiveChange,
      orientation,
    });

  const id = useId(idProp);
  const className = cx(classBase, `${classBase}-${orientation}`, classNameProp);

  console.log(`TabstripNext focusVisible = ${focusVisible}`);

  const handleAddTabClick = useCallback(() => {
    console.log("add tab");
    // onAddTab?.();
  }, []);

  const [tabs, selectedTabId] = useMemo(() => {
    let selectedTabId: string | null = null;
    return [
      asReactElements(children)
        .map((child, index) => {
          const selected = index === activeTabIndex;
          const tabId = child.props.id ?? `${id}-tab-${index}`;
          if (selected) {
            selectedTabId = tabId;
          }
          return React.cloneElement(child, {
            ...tabProps,
            ...tabstripHook.navigationProps,
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
      selectedTabId,
    ];
  }, [
    activeTabIndex,
    children,
    enableAddTab,
    focusVisible,
    handleAddTabClick,
    id,
    tabProps,
    tabstripHook.navigationProps,
  ]);

  return showActivationIndicator ? (
    <div {...htmlAttributes} className={className} role="tablist">
      <OverflowContainer
        {...tabstripHook.containerProps}
        height={24}
        ref={rootRef}
        id={id}
      >
        {tabs}
      </OverflowContainer>
      <TabActivationIndicator orientation={orientation} tabId={selectedTabId} />
    </div>
  ) : (
    <OverflowContainer
      {...htmlAttributes}
      {...tabstripHook.containerProps}
      className={className}
      height={24}
      id={id}
      ref={rootRef}
    >
      {tabs}
    </OverflowContainer>
  );
};
