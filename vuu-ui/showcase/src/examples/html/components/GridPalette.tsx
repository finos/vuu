import cx from "clsx";
import { queryClosest } from "@finos/vuu-utils";
import { DragEvent, HTMLAttributes, useCallback } from "react";
import { useDraggable, useGridLayoutDragStartHandler } from "@finos/vuu-layout";

import "./GridPalette.css";

const classBase = "vuuGridPalette";

export interface GridPaletteProps extends HTMLAttributes<HTMLDivElement> {
  paletteItems: GridPaletteItem[];
}

export type GridPaletteItem = {
  id: string;
  label: string;
  props: unknown;
  type: string;
};

export const GridPalette = ({
  paletteItems,
  ...htmlAttributes
}: GridPaletteProps) => {
  const getPayload = useCallback(
    (evt: DragEvent<Element>): [string, string] => {
      const draggedItem = queryClosest(evt.target, ".vuuGridPalette-item");
      if (draggedItem) {
        const index = parseInt(draggedItem.dataset.index ?? "-1");
        const item = paletteItems[index] as GridPaletteItem;
        return ["text/json", JSON.stringify(item)];
      }
      throw Error("no palette item to provide payload");
    },
    [paletteItems]
  );

  const onDragStart = useGridLayoutDragStartHandler();
  const draggableProps = useDraggable({ getPayload, onDragStart });

  return (
    <div {...htmlAttributes} className={classBase} {...draggableProps}>
      {paletteItems.map((paletteItem, index) => (
        <div
          className={cx(`${classBase}-item`)}
          data-item-id={paletteItem.id}
          draggable
          data-index={index}
          key={index}
        >
          {paletteItem.label}
        </div>
      ))}
    </div>
  );
};
