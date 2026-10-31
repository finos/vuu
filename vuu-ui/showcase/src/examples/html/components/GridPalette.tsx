import { queryClosest } from "@vuu-ui/vuu-utils";
import {
  useDraggable,
  useGridLayoutDragStartHandler,
} from "@heswell/grid-layout";
import cx from "clsx";
import { CSSProperties, DragEvent, HTMLAttributes, useCallback } from "react";

import "./GridPalette.css";
import { TemplateSource } from "@heswell/grid-layout/src/GridLayoutContext";

const classBase = "vuuGridPalette";

export interface GridPaletteProps extends HTMLAttributes<HTMLDivElement> {
  paletteItems: GridPaletteItem[];
}

export type GridPaletteItem = {
  paletteEntry: {
    label: string;
    style?: CSSProperties;
  };
  component: {
    label: string;
    props: unknown;
    type: string;
  };
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
          componentJson: JSON.stringify(item.component),
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
      {paletteItems.map(({ paletteEntry }, index) => (
        <div
          className={cx(`${classBase}-item`)}
          data-index={index}
          key={index}
          style={paletteEntry.style}
        >
          <div
            data-item-id={paletteEntry.label.toLowerCase()}
            draggable
            style={{ padding: "3px 8px" }}
          >
            {paletteEntry.label}
          </div>
        </div>
      ))}
    </div>
  );
};
