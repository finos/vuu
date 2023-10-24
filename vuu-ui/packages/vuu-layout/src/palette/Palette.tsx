import { uuid } from "@finos/vuu-utils";
import {
  List,
  ListItem,
  ListItemProps,
  ListProps,
} from "@finos/vuu-ui-controls";
import cx from "classnames";
import {
  cloneElement,
  HTMLAttributes,
  memo,
  MouseEvent,
  ReactElement,
} from "react";
import { useLayoutProviderDispatch } from "../layout-provider";
import { View, ViewProps } from "../layout-view";
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
        data-draggable
        data-icon="draggable"
        {...props}
      />
    );
  }
);

PaletteItem.displayName = "PaletteItem";

export interface PaletteProps
  extends Omit<
    HTMLAttributes<HTMLDivElement>,
    "onDragStart" | "onDrop" | "onSelect"
  > {
  ListProps?: Partial<ListProps>;
  ViewProps?: Partial<ViewProps>;
  children: ReactElement[];
  itemHeight?: number;
  orientation: "horizontal" | "vertical";
  selection?: string;
}

export const Palette = ({
  ListProps,
  ViewProps,
  children,
  className,
  itemHeight = 41,
  orientation = "horizontal",
  ...props
}: PaletteProps) => {
  const dispatch = useLayoutProviderDispatch();
  const classBase = "vuuPalette";

  function handleMouseDown(evt: MouseEvent) {
    const target = evt.target as HTMLElement;
    const listItemElement = target.closest(".vuuPaletteItem") as HTMLElement;
    const idx = parseInt(listItemElement.dataset?.index ?? "-1");
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
      <View {...ViewProps} {...identifiers} {...props} title={props.label}>
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
        DriftHomeIfNoDropTarget: true,
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
      {...ListProps}
      {...props}
      className={cx(classBase, className, `${classBase}-${orientation}`)}
      itemHeight={itemHeight}
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
