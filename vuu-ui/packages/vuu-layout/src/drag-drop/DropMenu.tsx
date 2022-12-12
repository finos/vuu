import React, { HTMLAttributes } from "react";
import cx from "classnames";
import { Column2AIcon, Column2BIcon } from "@vuu-ui/ui-controls";
import "./DropMenu.css";
import { DropTarget } from "./DropTarget";

export function computeMenuPosition(
  dropTarget: DropTarget,
  offsetTop = 0,
  offsetLeft = 0
): [number, number, "left" | "bottom" | "right" | "top"] {
  const { pos, clientRect: box } = dropTarget;
  const menuOffset = 20;

  return pos.position.West
    ? [box.left - offsetLeft + menuOffset, pos.y - offsetTop, "left"]
    : pos.position.South
    ? [pos.x - offsetLeft, box.bottom - offsetTop - menuOffset, "bottom"]
    : pos.position.East
    ? [box.right - offsetLeft - menuOffset, pos.y - offsetTop, "right"]
    : /* North | Header*/ [
        pos.x - offsetLeft,
        box.top - offsetTop + menuOffset,
        "top",
      ];
}

const getIcon = (i: number) => {
  if (i === 0) {
    return <Column2AIcon />;
  } else {
    return <Column2BIcon />;
  }
};

export interface DropMenuProps extends HTMLAttributes<HTMLDivElement> {
  dropTarget: DropTarget;
  onHover: (target: DropTarget | null) => void;
  orientation?: "left" | "top" | "right" | "bottom";
}

export const DropMenu = ({
  className,
  dropTarget,
  onHover,
  orientation,
}: DropMenuProps) => {
  const dropTargets = dropTarget.toArray();
  // TODO we have all the information here to draw a mini target map
  // but maybe thats overkill ...

  return (
    <div
      className={cx("hwDropMenu", className, orientation)}
      onMouseLeave={() => onHover(null)}
    >
      {dropTargets.map((target, i) => (
        <div
          key={i}
          className="hwDropMenu-item"
          onMouseEnter={() => onHover(target)}
        >
          {getIcon(i)}
        </div>
      ))}
    </div>
  );
};
