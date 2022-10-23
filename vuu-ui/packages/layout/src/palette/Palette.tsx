import { List } from "@vuu-ui/ui-controls";
import { uuid } from "@vuu-ui/utils";
import cx from "classnames";
import { HTMLAttributes, MouseEvent, ReactElement, ReactNode } from "react";
import { useLayoutProviderDispatch } from "../layout-provider";
import { View } from "../layout-view";
import { registerComponent } from "../registry/ComponentRegistry";

import "./Palette.css";

// All props are spread to the View
export const PaletteItem = (props: { children: ReactNode }) => props.children;

export interface ComponentIconProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onMouseDown"> {
  component: ReactElement;
  idx: number;
  onMouseDown: (evt: MouseEvent, idx: number) => void;
  text: string;
}

const ComponentIcon = ({
  className,
  component,
  idx,
  text,
  onMouseDown,
  ...props
}: ComponentIconProps) => {
  const handleMouseDown = (evt: MouseEvent) => onMouseDown(evt, idx);
  return (
    <div
      className="hwComponentIcon hwListItem"
      onMouseDown={handleMouseDown}
      {...props}
    >
      <span>{text}</span>
    </div>
  );
};

export interface PaletteProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactElement[];
  orientation: "horizontal" | "vertical";
  selection?: string;
}

export const Palette = ({
  children,
  className,
  orientation = "horizontal",
  selection = "none",
  ...props
}: PaletteProps) => {
  const dispatch = useLayoutProviderDispatch();

  const classBase = "hwPalette";

  function handleMouseDown(evt: MouseEvent, idx: number) {
    const {
      props: { caption, children: payload, template, ...props },
    } = children[idx];
    const { left, top, width } = evt.currentTarget.getBoundingClientRect();
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
      type: "drag-start",
      evt: evt.nativeEvent,
      path: "*",
      component,
      instructions: {
        DoNotRemove: true,
        DoNotTransform: true,
        RemoveDraggableOnDragEnd: true,
        dragThreshold: 10,
      },
      dragRect: {
        left,
        top,
        right: left + width,
        bottom: top + 150,
        width,
        height: 100,
      },
    });
  }

  return (
    <List
      {...props}
      className={cx(classBase, className, `${classBase}-${orientation}`)}
      selection={selection}
    >
      {children.map((child, idx) =>
        child.type === PaletteItem ? (
          <ComponentIcon
            key={idx}
            idx={idx}
            text={child.props.caption || child.props.label}
            component={child}
            onMouseDown={handleMouseDown}
          ></ComponentIcon>
        ) : (
          child
        )
      )}
    </List>
  );
};

registerComponent("Palette", Palette, "view");
