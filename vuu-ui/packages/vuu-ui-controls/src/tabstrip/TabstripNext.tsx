import { TabstripProps } from "./TabsTypes";
import { useIdMemo as useId } from "@salt-ds/core";

import { useTabstripNext } from "./useTabstripNext";
import cx from "classnames";
import { asReactElements, OverflowContainer } from "@finos/vuu-layout";
import { TabActivationIndicator } from "./TabActivationIndicator";

import "./Tabstrip.css";
import React, { useMemo, useRef } from "react";

const classBase = "vuuTabstrip";

export interface TabstripNextProps extends TabstripProps {
  activeTabIndex: number;
}

export const TabstripNext = ({
  activeTabIndex: activeTabIndexProp,
  children,
  className: classNameProp,
  id: idProp,
  keyBoardActivation = "manual",
  onActiveChange,
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

  const [tabs, selectedTabId] = useMemo(() => {
    let selectedTabId: string | null = null;
    return [
      asReactElements(children).map((child, index) => {
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
      }),
      selectedTabId,
    ];
  }, [activeTabIndex, children, focusVisible, id, tabProps]);

  return showActivationIndicator ? (
    <div {...htmlAttributes} className={className}>
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
