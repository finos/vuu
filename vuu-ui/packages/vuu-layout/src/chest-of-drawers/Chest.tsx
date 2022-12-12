import React, { HTMLAttributes, ReactElement } from "react";
import cx from "classnames";
import Drawer from "./Drawer";
import { partition } from "@vuu-ui/vuu-utils";
import { registerComponent } from "../registry/ComponentRegistry";

import "./Chest.css";

const isDrawer = (component: ReactElement) => component.type === Drawer;
const isVertical = ({ props: { position = "left" } }: ReactElement) =>
  position.match(/top|bottom/);

export interface ChestProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactElement[];
}

const Chest = (props: ChestProps) => {
  const { children, className: classNameProp, id, style } = props;
  const classBase = "hwChest";
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
Chest.displayName = "Chest";

export default Chest;

registerComponent("Chest", Chest, "container");
