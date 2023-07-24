import { partition } from "@finos/vuu-utils";
import cx from "classnames";
import { HTMLAttributes, ReactElement } from "react";
import { registerComponent } from "../registry/ComponentRegistry";
import Drawer from "./Drawer";

import "./DockLayout.css";

const isDrawer = (component: ReactElement) => component.type === Drawer;
const isVertical = ({ props: { position = "left" } }: ReactElement) =>
  position.match(/top|bottom/);

export interface DockLayoutProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactElement[];
}

const DockLayout = (props: DockLayoutProps) => {
  const { children, className: classNameProp, id, style } = props;
  const classBase = "vuuDockLayout";
  const [drawers, content] = partition(children, isDrawer);
  const [verticalDrawers, horizontalDrawers] = partition(drawers, isVertical);
  const orientation =
    verticalDrawers.length === 0
      ? "horizontal"
      : horizontalDrawers.length === 0
      ? "vertical"
      : "both";

  const className = cx(classBase, classNameProp, `${classBase}-${orientation}`);

  return (
    <div className={className} id={id} style={style}>
      {drawers}
      <div className={`${classBase}-content`}>{content}</div>
    </div>
  );
};
DockLayout.displayName = "DockLayout";

export default DockLayout;

registerComponent("DockLayout", DockLayout, "container");
