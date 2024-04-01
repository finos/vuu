import cx from "clsx";
import { queryClosest } from "@finos/vuu-utils";
import { DragEventHandler, useCallback } from "react";

import "./GridPalette.css";

const classBase = "vuuGridPalette";

const colors = ["red", "green", "pink", "brown", "orange", "purple"];

export const GridPalette = () => {
  const onDragStart = useCallback<DragEventHandler>((evt) => {
    const draggedItem = queryClosest(evt.target, ".vuuGridPalette-item");
    if (draggedItem) {
      console.log(`drag start ${draggedItem.id}`);
    }
  }, []);

  return (
    <div className={classBase} onDragStart={onDragStart}>
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
