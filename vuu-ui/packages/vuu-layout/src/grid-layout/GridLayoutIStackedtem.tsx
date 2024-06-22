import {
  GridLayoutItemProps,
  useDraggable,
  useGridLayoutDragStartHandler,
  useGridLayoutProps,
  useGridLayoutProviderDispatch
} from "@finos/vuu-layout";
import { IconButton } from "@finos/vuu-ui-controls";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { DragEvent, MouseEventHandler, useCallback } from "react";
import { useAsDropTarget } from "./useAsDropTarget";
import { useNotDropTarget } from "./useNotDropTarget";

import { queryClosest } from "@finos/vuu-utils";
import gridLayoutCss from "./GridLayout.css";
import gridSplitterCss from "./GridSplitter.css";

const classBaseItem = "vuuGridLayoutItem";

export const GridLayoutStackedItem = ({
  children,
  className: classNameProp,
  header,
  id,
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
    window: targetWindow
  });
  useComponentCssInjection({
    testId: "vuu-grid-splitter",
    css: gridSplitterCss,
    window: targetWindow
  });

  const dispatch = useGridLayoutProviderDispatch();
  const layoutProps = useGridLayoutProps(id);
  const onDragStart = useGridLayoutDragStartHandler();

  const onClose = useCallback<MouseEventHandler<HTMLButtonElement>>(
    (evt) => {
      evt.stopPropagation();
      dispatch({ type: "close", id });
    },
    [dispatch, id]
  );

  const getPayload = useCallback(
    (evt: DragEvent<Element>): [string, string] => {
      const draggedItem = queryClosest(evt.target, ".vuuGridLayoutItem");
      if (draggedItem) {
        return ["text/plain", draggedItem.id];
      }
      throw Error("GridLayoutItem no found");
    },
    []
  );

  const useDropTargetHook = isDropTarget ? useAsDropTarget : useNotDropTarget;
  const { dropTargetClassName, ...droppableProps } = useDropTargetHook();
  const draggableProps = useDraggable({
    draggableClassName: classBaseItem,
    getPayload,
    onDragStart
  });

  const className = cx(classBaseItem, {
    [`${classBaseItem}-resizeable-h`]: resizeable === "h",
    [`${classBaseItem}-resizeable-v`]: resizeable === "v",
    [`${classBaseItem}-resizeable-vh`]: resizeable === "hv"
  });

  const style = {
    ...styleProp,
    ...layoutProps,
    "--header-height": header ? "25px" : "0px"
  };

  return (
    <div
      {...htmlAttributes}
      {...droppableProps}
      {...draggableProps}
      className={cx(className)}
      id={id}
      key={id}
      style={style}
    >
      {header ? (
        <div
          className={cx(`${classBaseItem}Header`, dropTargetClassName)}
          data-drop-target="tabs"
        >
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
      <div className={cx(`${classBaseItem}Content`, dropTargetClassName)}>
        {children}
      </div>
    </div>
  );
};
