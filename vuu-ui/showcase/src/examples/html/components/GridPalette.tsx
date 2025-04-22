import { queryClosest } from "@finos/vuu-utils";
import {
  useDraggable,
  useGridLayoutDragStartHandler,
  type DragSource,
} from "@heswell/grid-layout";
import cx from "clsx";
import { DragEvent, HTMLAttributes, useCallback } from "react";

import "./GridPalette.css";
import { TemplateSource } from "@heswell/grid-layout/src/GridLayoutContext";

const classBase = "vuuGridPalette";

export interface GridPaletteProps extends HTMLAttributes<HTMLDivElement> {
  paletteItems: GridPaletteItem[];
}

export type GridPaletteItem = {
  label: string;
  props: unknown;
  type: string;
};

export const GridPalette = ({
  paletteItems,
  ...htmlAttributes
}: GridPaletteProps) => {
  const getDragSource = useCallback(
    (evt: DragEvent<Element>): TemplateSource => {
      const draggedItem = queryClosest(evt.target, ".vuuGridPalette-item");
      if (draggedItem) {
        const gridLayout = queryClosest(draggedItem, ".vuuGridLayout", true);

        const index = parseInt(draggedItem.dataset.index ?? "-1");
        const item = paletteItems[index] as GridPaletteItem;
        return {
          element: draggedItem,
          componentJson: JSON.stringify(item),
          layoutId: gridLayout.id,
          label: "123",
          type: "template",
        };
      }
      throw Error("no palette item to provide payload");
    },
    [paletteItems],
  );

  const onDragStart = useGridLayoutDragStartHandler();
  const draggableProps = useDraggable({
    getDragSource,
    onDragStart,
  });

  return (
    <div {...htmlAttributes} className={classBase} {...draggableProps}>
      {paletteItems.map((paletteItem, index) => (
        <div className={cx(`${classBase}-item`)} data-index={index} key={index}>
          <div
            data-item-id={paletteItem.label.toLowerCase()}
            draggable
            style={{ padding: "3px 8px" }}
          >
            {paletteItem.label}
          </div>
        </div>
      ))}
    </div>
  );
};
