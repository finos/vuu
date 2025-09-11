import { queryClosest, registerComponent, uuid } from "@vuu-ui/vuu-utils";
import { ListBox, ListBoxProps, Option, OptionProps } from "@salt-ds/core";

import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import {
  HTMLAttributes,
  MouseEventHandler,
  ReactElement,
  cloneElement,
  memo,
  useCallback,
} from "react";
import { useLayoutProviderDispatch } from "../layout-provider";
import { View, ViewProps } from "../layout-view";

import paletteCss from "./Palette.css";

const classBase = "vuuPalette";

const clonePaletteItem = (paletteItem: HTMLElement) => {
  const dolly = paletteItem.cloneNode(true) as HTMLElement;
  dolly.id = "";
  delete dolly.dataset.idx;
  return dolly;
};

const wrapInView = (
  component: ReactElement,
  viewProps?: Partial<ViewProps>,
) => {
  const id = uuid();
  return (
    <View id={id} key={id} {...viewProps}>
      {component}
    </View>
  );
};
export interface PaletteItemProps extends OptionProps {
  /**
   * This is the payload that will be created when the
   * palette item is dropped
   */
  ViewProps?: Pick<
    ViewProps,
    "allowRename" | "closeable" | "header" | "resizeable" | "resize" | "title"
  >;
  component: ReactElement;
  idx?: number;
}

export const PaletteItem = memo(
  ({
    className,
    component,
    idx,
    key,
    value,
    ViewProps,
    ...props
  }: PaletteItemProps) => {
    const targetWindow = useWindow();
    useComponentCssInjection({
      testId: "vuu-palette",
      css: paletteCss,
      window: targetWindow,
    });
    const dispatch = useLayoutProviderDispatch();

    const handleMouseDown = useCallback<MouseEventHandler<HTMLDivElement>>(
      (e) => {
        const el = queryClosest(e.target, ".vuuPaletteItem", true);
        const { height, left, top, width } = el.getBoundingClientRect();

        dispatch({
          dragRect: {
            left,
            top,
            right: left + width,
            bottom: top + 150,
            width,
            height,
          },
          dragElement: clonePaletteItem(el),
          evt: e.nativeEvent,
          instructions: {
            DoNotRemove: true,
            DoNotTransform: true,
            DriftHomeIfNoDropTarget: true,
            RemoveDraggableOnDragEnd: true,
            dragThreshold: 10,
          },
          path: "*",
          payload: wrapInView(component, ViewProps),
          type: "drag-start",
        });
      },
      [ViewProps, component, dispatch],
    );

    return (
      <Option
        className={cx("vuuPaletteItem", className)}
        data-draggable
        data-index={idx}
        onMouseDown={handleMouseDown}
        value={value}
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
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any)
          : child,
      )}
    </ListBox>
  );
};

registerComponent("Palette", Palette, "view");
