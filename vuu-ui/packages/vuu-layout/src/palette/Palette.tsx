import { List, ListItem, ListItemProps } from "@heswell/uitk-lab";
import { uuid } from "@vuu-ui/vuu-utils";
import cx from "classnames";
import {
  cloneElement,
  HTMLAttributes,
  memo,
  MouseEvent,
  ReactElement,
} from "react";
import { useLayoutProviderDispatch } from "../layout-provider";
import { View } from "../layout-view";
import { registerComponent } from "../registry/ComponentRegistry";

import "./Palette.css";

const clonePaletteItem = (paletteItem: HTMLElement) => {
  const dolly = paletteItem.cloneNode(true) as HTMLElement;
  dolly.id = "";
  delete dolly.dataset.idx;
  return dolly;
};

export interface PaletteItemProps extends ListItemProps {
  children: ReactElement;
  closeable?: boolean;
  header?: boolean;
  idx?: number;
  resize?: "defer";
  resizeable?: boolean;
}

export const PaletteItem = memo(
  ({
    className,
    children: component,
    idx,
    resizeable,
    header,
    closeable,
    ...props
  }: PaletteItemProps) => {
    return (
      <ListItem
        className={cx("vuuPaletteItem", className)}
        data-icon="grab-handle"
        {...props}
      />
    );
  }
);

PaletteItem.displayName = "PaletteItem";

export interface PaletteProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onSelect"> {
  children: ReactElement[];
  orientation: "horizontal" | "vertical";
  selection?: string;
}

export const Palette = ({
  children,
  className,
  orientation = "horizontal",
  ...props
}: PaletteProps) => {
  const dispatch = useLayoutProviderDispatch();
  const classBase = "vuuPalette";

  function handleMouseDown(evt: MouseEvent) {
    const target = evt.target as HTMLElement;
    const listItemElement = target.closest(".vuuPaletteItem") as HTMLElement;
    const idx = parseInt(listItemElement.dataset.idx ?? "-1");
    if (idx !== -1) {
      console.log({
        children,
        idx,
        listItemElement,
      });
    }
    const {
      props: { caption, children: payload, template, ...props },
    } = children[idx];
    const { height, left, top, width } =
      listItemElement.getBoundingClientRect();
    const id = uuid();
    const identifiers = { id, key: id };
    const component = template ? (
      payload
    ) : (
      <View {...identifiers} {...props} title={props.label}>
        {payload}
      </View>
    );

    dispatch({
      dragRect: {
        left,
        top,
        right: left + width,
        bottom: top + 150,
        width,
        height,
      },
      dragElement: clonePaletteItem(listItemElement),
      evt: evt.nativeEvent,
      instructions: {
        DoNotRemove: true,
        DoNotTransform: true,
        RemoveDraggableOnDragEnd: true,
        dragThreshold: 10,
      },
      path: "*",
      payload: component,
      type: "drag-start",
    });
  }

  return (
    <List
      {...props}
      borderless
      className={cx(classBase, className, `${classBase}-${orientation}`)}
      maxHeight={800}
      selected={null}
    >
      {children.map((child, idx) =>
        child.type === PaletteItem
          ? cloneElement(child, {
              key: idx,
              onMouseDown: handleMouseDown,
            })
          : child
      )}
    </List>
  );
};

registerComponent("Palette", Palette, "view");
