import { Action, useLayoutProviderDispatch } from "@finos/vuu-layout";
import { LayoutResizeAction } from "@finos/vuu-layout/src/layout-reducer";
import cx from "classnames";
import { VuuLogo } from "@finos/vuu-icons";
import { HTMLAttributes, useCallback, useRef, useState } from "react";

import "./LeftNav.css";
import { Tab, Tabstrip } from "@finos/vuu-ui-controls";
import { useThemeAttributes } from "../theme-provider";

const classBase = "vuuLeftNav";

interface LeftNavProps extends HTMLAttributes<HTMLDivElement> {
  "data-path"?: string;
  onResize?: (size: number) => void;
  open?: boolean;
}

export const LeftNav = ({
  "data-path": path,
  onResize,
  open = true,
  ...htmlAttributes
}: LeftNavProps) => {
  const dispatch = useLayoutProviderDispatch();
  const openRef = useRef(open);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [themeClass] = useThemeAttributes();

  const handleTabSelection = useCallback((value: number) => {
    setActiveTabIndex(value);
    // if (path) {
    // dispatch({ type: "switch-tab", path, nextIdx });
    // onTabSelectionChanged?.(nextIdx);
    // }
  }, []);

  const toggleSize = useCallback(() => {
    openRef.current = !openRef.current;
    dispatch({
      type: Action.LAYOUT_RESIZE,
      path,
      size: openRef.current ? 240 : 80,
    } as LayoutResizeAction);
  }, [dispatch, path]);
  return (
    <div
      {...htmlAttributes}
      className={cx(classBase, themeClass)}
      data-mode="dark"
    >
      <div className="vuuLeftNav-logo">
        <VuuLogo />
      </div>
      <div className={`${classBase}-main`}>
        <Tabstrip
          activeTabIndex={activeTabIndex}
          animateSelectionThumb={false}
          className={`${classBase}-Tabstrip`}
          onActiveChange={handleTabSelection}
          orientation="vertical"
        >
          <Tab data-icon="demo" label="DEMO"></Tab>
          <Tab data-icon="tables" label="VUU TABLES"></Tab>
          <Tab data-icon="templates" label="LAYOUT TEMPLATES"></Tab>
          <Tab data-icon="layouts" label="MY LAYOUTS"></Tab>
        </Tabstrip>
      </div>
      <div className="vuuLeftNav-buttonBar">
        <button
          className={cx("vuuLeftNav-toggleButton", {
            "vuuLeftNav-toggleButton-open": openRef.current,
            "vuuLeftNav-toggleButton-closed": !openRef.current,
          })}
          data-icon={openRef.current ? "chevron-left" : "chevron-right"}
          onClick={toggleSize}
        />
      </div>
    </div>
  );
};
