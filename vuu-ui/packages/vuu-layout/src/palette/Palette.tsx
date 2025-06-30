import { registerComponent, uuid } from "@vuu-ui/vuu-utils";
import { ListBox, ListBoxProps, Option, OptionProps } from "@salt-ds/core";

import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import {
  HTMLAttributes,
  MouseEvent,
  ReactElement,
  cloneElement,
  memo,
} from "react";
import { useLayoutProviderDispatch } from "../layout-provider";
import { View, ViewProps } from "../layout-view";

import paletteCss from "./Palette.css";

const clonePaletteItem = (paletteItem: HTMLElement) => {
  const dolly = paletteItem.cloneNode(true) as HTMLElement;
  dolly.id = "";
  delete dolly.dataset.idx;
  return dolly;
};

export interface PaletteItemProps extends OptionProps {
  /**
   * This is the payload that will be created when the
   * palette item is dropped
   */
  component: ReactElement;
  closeable?: boolean;
  header?: boolean;
  idx?: number;
  resize?: "defer";
  resizeable?: boolean;
}

export const PaletteItem = memo(
  ({
    className,
    component,
    idx,
    key,
    resizeable,
    header,
    closeable,
    ...props
  }: PaletteItemProps) => {
    const targetWindow = useWindow();
    useComponentCssInjection({
      testId: "vuu-palette",
      css: paletteCss,
      window: targetWindow,
    });

    return (
      <Option
        className={cx("vuuPaletteItem", className)}
        data-draggable
        data-index={idx}
        {...props}
      />
    );
  },
);

PaletteItem.displayName = "PaletteItem";

export interface PaletteProps
  extends Omit<
    HTMLAttributes<HTMLDivElement>,
    "onDragStart" | "onDrop" | "onSelect"
  > {
  ListBoxProps?: Partial<ListBoxProps>;
  ViewProps?: Partial<ViewProps>;
  children: ReactElement[];
  orientation: "horizontal" | "vertical";
  selection?: string;
}

export const Palette = ({
  ListBoxProps,
  ViewProps,
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
    const idx = parseInt(listItemElement.dataset?.index ?? "-1");
    const {
      props: { caption, component: payload, key, template, ...props },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } = children[idx] as any;
    const { ViewProps: componentViewProps } = payload.props;
    const { height, left, top, width } =
      listItemElement.getBoundingClientRect();
    const id = uuid();
    console.log({
      ViewProps,
      props,
    });
    const component = template ? (
      payload
    ) : (
      <View
        id={id}
        key={id}
        {...ViewProps}
        {...props}
        {...componentViewProps}
        title={props.label}
      >
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
    <ListBox
      {...ListBoxProps}
      {...props}
      className={cx(classBase, className, `${classBase}-${orientation}`)}
      selected={[]}
    >
      {children.map((child, idx) =>
        child.type === PaletteItem
          ? cloneElement(child, {
              idx,
              key: idx,
              onMouseDown: handleMouseDown,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any)
          : child,
      )}
    </ListBox>
  );
};

registerComponent("Palette", Palette, "view");
