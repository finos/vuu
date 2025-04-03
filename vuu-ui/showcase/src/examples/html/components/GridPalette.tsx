import cx from "clsx";
import { queryClosest } from "@finos/vuu-utils";
import {
  DragEvent,
  DragEventHandler,
  HTMLAttributes,
  useCallback,
} from "react";
import { useDraggable } from "@finos/vuu-layout";

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

  const draggableProps = useDraggable({ getPayload });

  return (
    <div {...htmlAttributes} className={classBase} {...draggableProps}>
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
