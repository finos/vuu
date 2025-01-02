import { IconButton } from "@finos/vuu-ui-controls";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import {
  CSSProperties,
  DragEvent,
  HTMLAttributes,
  MouseEventHandler,
  useCallback,
  useEffect,
} from "react";
import { useAsDropTarget } from "./useAsDropTarget";
import { useNotDropTarget } from "./useNotDropTarget";

import { queryClosest } from "@finos/vuu-utils";
import gridLayoutCss from "./GridLayout.css";
import gridSplitterCss from "./GridSplitter.css";
import { DragSource } from "../drag-drop-next/DragContextNext";
import { GridModelChildItemProps } from "./GridModel";
import {
  useGridChildProps,
  useGridLayoutDragStartHandler,
  useGridLayoutProviderDispatch,
} from "./GridLayoutProvider";
import { useDraggable } from "./useDraggable";

const classBaseItem = "vuuGridLayoutItem";

export interface GridLayoutItemProps
  extends GridModelChildItemProps,
    Omit<
      HTMLAttributes<HTMLDivElement>,
      "id" | "onDragStart" | "onDrop" | "style"
    > {
  header?: boolean;
  isDropTarget?: boolean;
  label?: string;
  style: CSSProperties & GridStyle;
}

const getDragSourceWithElement = (
  evt: DragEvent<Element>,
): DragSource & { element: HTMLElement } => {
  const draggedItem = queryClosest(evt.target, ".vuuGridLayoutItem");
  if (draggedItem) {
    return {
      element: draggedItem,
      id: draggedItem.id,
      index: -1,
      label: "no label",
      type: "component",
    };
  }
  throw Error("GridLayoutItem no found");
};

export const GridLayoutItem = ({
  children,
  className: classNameProp,
  header,
  id,
  // TODO is it ever false ?
  isDropTarget = true,
  resizeable,
  style: styleProp,
  title,
  ...htmlAttributes
}: GridLayoutItemProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-grid-layout",
    css: gridLayoutCss,
    window: targetWindow,
  });
  useComponentCssInjection({
    testId: "vuu-grid-splitter",
    css: gridSplitterCss,
    window: targetWindow,
  });

  const dispatch = useGridLayoutProviderDispatch();
  // TODO pass the styleProps in here to initialise the model value
  const layoutProps = useGridChildProps({ id, resizeable, style: styleProp });

  useEffect(
    () => () => {
      console.log(`unmount layout item ${id}`);
    },
    [id],
  );

  // why can't the hook that processes this make this call ?
  const onDragStart = useGridLayoutDragStartHandler();

  const onClose = useCallback<MouseEventHandler<HTMLButtonElement>>(
    (evt) => {
      evt.stopPropagation();
      dispatch({ type: "close", id });
    },
    [dispatch, id],
  );

  const useDropTargetHook = isDropTarget ? useAsDropTarget : useNotDropTarget;
  const droppableProps = useDropTargetHook();
  const draggableProps = useDraggable({
    draggableClassName: classBaseItem,
    getDragSource: getDragSourceWithElement,
    onDragStart,
  });

  const className = cx(classBaseItem, {
    [`${classBaseItem}-resizeable-h`]: resizeable === "h",
    [`${classBaseItem}-resizeable-v`]: resizeable === "v",
    [`${classBaseItem}-resizeable-vh`]: resizeable === "hv",
  });

  const style = {
    ...styleProp,
    ...layoutProps,
    "--header-height": header ? "25px" : "0px",
  };

  return (
    <div
      {...htmlAttributes}
      {...draggableProps}
      {...droppableProps}
      className={cx(className)}
      id={id}
      key={id}
      style={style}
    >
      {header ? (
        <div className={cx(`${classBaseItem}Header`)} data-drop-target="header">
          <span className={`${classBaseItem}Header-title`} draggable>
            {title}
          </span>
          <IconButton
            className={`${classBaseItem}Header-close`}
            data-align="right"
            icon="close"
            onClick={onClose}
            variant="secondary"
          />
        </div>
      ) : null}
      <div className={cx(`${classBaseItem}Content`)} data-drop-target>
        {children}
      </div>
    </div>
  );
};
