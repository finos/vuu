import cx from "clsx";
import { queryClosest } from "@finos/vuu-utils";
import { DragEventHandler, HTMLAttributes, useCallback } from "react";

import "./GridPalette.css";

const classBase = "vuuGridPalette";

const colors = ["red", "green", "pink", "brown", "orange", "purple"];

export interface GridPaletteProps extends HTMLAttributes<HTMLDivElement> {
  paletteItems: GridPaletteItem[];
}

export type GridPaletteItem = {
  id: string;
  label: string;
  props: any;
  type: string;
};

export const GridPalette = ({
  paletteItems,
  ...htmlAttributes
}: GridPaletteProps) => {
  const onDragStart = useCallback<DragEventHandler>(
    (evt) => {
      const draggedItem = queryClosest(evt.target, ".vuuGridPalette-item");
      if (draggedItem) {
        const index = parseInt(draggedItem.dataset.index ?? "-1");
        const item = paletteItems[index] as GridPaletteItem;
        evt.dataTransfer.setData("text/json", JSON.stringify(item));
        evt.dataTransfer.effectAllowed = "move";
        console.log(`drag start ${draggedItem.id}`);
      }
    },
    [paletteItems]
  );

  return (
    <div {...htmlAttributes} className={classBase} onDragStart={onDragStart}>
      {paletteItems.map((paletteItem, index) => (
        <div
          className={cx(`${classBase}-item`)}
          draggable
          data-index={index}
          key={index}
          style={{ background: colors[index] }}
        >
          {paletteItem.label}
        </div>
      ))}
    </div>
  );
};
