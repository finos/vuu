import cx from "clsx";
import { queryClosest } from "@finos/vuu-utils";
import { DragEventHandler, HTMLAttributes, useCallback } from "react";

import "./GridPalette.css";

const classBase = "vuuGridPalette";

const colors = ["red", "green", "pink", "brown", "orange", "purple"];

export type GridPaletteProps = HTMLAttributes<HTMLDivElement>;

export const GridPalette = ({ ...htmlAttributes }: GridPaletteProps) => {
  const onDragStart = useCallback<DragEventHandler>((evt) => {
    const draggedItem = queryClosest(evt.target, ".vuuGridPalette-item");
    if (draggedItem) {
      evt.dataTransfer.setData("text/plain", draggedItem.id);
      evt.dataTransfer.effectAllowed = "move";
      console.log(`drag start ${draggedItem.id}`);
    }
  }, []);

  return (
    <div {...htmlAttributes} className={classBase} onDragStart={onDragStart}>
      {colors.map((color, index) => (
        <div
          className={cx(`${classBase}-item`)}
          draggable
          id={color}
          key={index}
          style={{ background: color }}
        >
          {color}
        </div>
      ))}
    </div>
  );
};
