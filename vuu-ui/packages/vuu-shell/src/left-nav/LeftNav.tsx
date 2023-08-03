import { Action, useLayoutProviderDispatch } from "@finos/vuu-layout";
import { LayoutResizeAction } from "@finos/vuu-layout/src/layout-reducer";
import cx from "classnames";
import { VuuLogo } from "@finos/vuu-icons";
import { HTMLAttributes, useCallback, useRef } from "react";

import "./LeftNav.css";
import { Tab, Tabstrip } from "@finos/vuu-ui-controls";

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

  const toggleSize = useCallback(() => {
    openRef.current = !openRef.current;
    dispatch({
      type: Action.LAYOUT_RESIZE,
      path,
      size: openRef.current ? 240 : 80,
    } as LayoutResizeAction);
  }, [dispatch, path]);
  return (
    <div {...htmlAttributes} className={classBase}>
      <div className="vuuLeftNav-logo">
        <VuuLogo />
      </div>
      <div className={`${classBase}-main`}>
        <Tabstrip
          activeTabIndex={0}
          animateSelectionThumb={false}
          className={`${classBase}-Tabstrip`}
          orientation="vertical"
        >
          <Tab label="DEMO"></Tab>
          <Tab label="VUU TABLES"></Tab>
          <Tab label="LAYOUT TEMPLATES"></Tab>
          <Tab label="MY LAYOUTS"></Tab>
        </Tabstrip>
        <ul className={`${classBase}-menu`}>
          <li
            className={cx(
              `${classBase}-menuitem`,
              `${classBase}-menuitem-active`
            )}
            data-icon="demo"
          >
            <span className={`${classBase}-menuitem-label`}>DEMO</span>
          </li>
          <li className={`${classBase}-menuitem`} data-icon="tables">
            <span className={`${classBase}-menuitem-label`}>VUU TABLES</span>
          </li>
          <li className={`${classBase}-menuitem`} data-icon="templates">
            <span className={`${classBase}-menuitem-label`}>
              LAYOUT TEMPLATES
            </span>
          </li>
          <li className={`${classBase}-menuitem`} data-icon="layouts">
            <span className={`${classBase}-menuitem-label`}>MY LAYOUTS</span>
          </li>
        </ul>
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
