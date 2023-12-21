import cx from "clsx";
import { HTMLAttributes } from "react";
import { DropTarget } from "./DropTarget";

import "./DropMenu.css";

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

const classBase = "vuuDropMenu";

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
      className={cx(classBase, className, `${classBase}-${orientation}`)}
      onMouseLeave={() => onHover(null)}
    >
      {dropTargets.map((target, i) => (
        <div
          key={i}
          className={`${classBase}-item`}
          data-icon={i === 0 ? "column-2A" : "column-2B"}
          onMouseEnter={() => onHover(target)}
        />
      ))}
    </div>
  );
};
