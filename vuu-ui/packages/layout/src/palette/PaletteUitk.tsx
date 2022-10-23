import { List, ListItem, ListItemProps, ListProps } from "@heswell/uitk-lab";
import { uuid } from "@vuu-ui/utils";
import cx from "classnames";
import { MouseEvent, ReactElement } from "react";
import { useLayoutProviderDispatch } from "../layout-provider";
import { View } from "../layout-view";
import { registerComponent } from "../registry/ComponentRegistry";

import "./PaletteUitk.css";

const classBase = "vuuPalette";

export interface PaletteListItemProps extends ListItemProps {
  children: ReactElement;
  ViewProps: {
    header?: boolean;
    closeable?: boolean;
    resizeable?: boolean;
  };
  template: boolean;
}

export const PaletteListItem = (props: PaletteListItemProps) => {
  const { children, ViewProps, label, onMouseDown, template, ...restProps } =
    props;
  const dispatch = useLayoutProviderDispatch();

  const handleMouseDown = (evt: MouseEvent<HTMLDivElement>) => {
    const { left, top, width } = evt.currentTarget.getBoundingClientRect();
    const id = uuid();
    const identifiers = { id, key: id };
    const component = template ? (
      children
    ) : (
      <View {...identifiers} {...ViewProps} title={props.label}>
        {children}
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
  };
  return (
    <ListItem onMouseDown={handleMouseDown} {...restProps}>
      {label}
    </ListItem>
  );
};

export const PaletteUitk = ({ className, ...props }: ListProps) => {
  return (
    <List
      {...props}
      className={cx(classBase, className)}
      height="100%"
      selectionStrategy="none"
    />
  );
};

registerComponent("PaletteUitk", PaletteUitk, "view");
