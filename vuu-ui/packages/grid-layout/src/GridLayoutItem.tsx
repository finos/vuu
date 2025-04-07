import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import {
  createElement,
  HTMLAttributes,
  isValidElement,
  MouseEventHandler,
  ReactElement,
  useCallback,
  useEffect,
} from "react";
import { useAsDropTarget } from "./useAsDropTarget";
import { useNotDropTarget } from "./useNotDropTarget";

import { queryClosest } from "@finos/vuu-utils";
import { componentToJson, LayoutJSON } from "./componentToJson";
import gridLayoutCss from "./GridLayout.css";
import {
  DragSourceProvider,
  useGridLayoutDispatch,
  useGridLayoutDragStartHandler,
} from "./GridLayoutContext";
import { GridModelChildItemProps } from "./GridModel";
import gridSplitterCss from "./GridSplitter.css";
import { useDraggable } from "./useDraggable";
import { useGridChildProps } from "./useGridChildProps";
import { IconButton } from "./IconButton";

const classBaseItem = "vuuGridLayoutItem";

export interface GridLayoutItemProps
  extends Omit<GridModelChildItemProps, "contentDetached" | "type">,
    Omit<
      HTMLAttributes<HTMLDivElement>,
      "id" | "onDragStart" | "onDrop" | "style"
    > {
  "data-drop-target"?: boolean | string;
  header?: boolean;
  /**
   * If provided, component is fixed height
   */
  height?: number;
  label?: string;
  /**
   * If provided, component is fixed width
   */
  width?: number;
}

const getDragSource: DragSourceProvider = (evt) => {
  const draggedItem = queryClosest(evt.target, ".vuuGridLayoutItem");
  const dragElement =
    (draggedItem?.querySelector(".vuuDraggableLabel") as HTMLElement) ||
    undefined;
  if (draggedItem) {
    const gridLayout = queryClosest(draggedItem, ".vuuGridLayout", true);
    return {
      dragElement,
      element: draggedItem,
      id: draggedItem.id,
      layoutId: gridLayout.id,
      label:
        draggedItem.querySelector(".vuuDraggableLabel")?.textContent ??
        "no label",
      type: "component",
    };
  }
  throw Error("GridLayoutItem no found");
};

export const GridLayoutItem = ({
  children,
  className: classNameProp,
  contentVisible: contentVisibleProp,
  "data-drop-target": dataDropTarget,
  header: headerProp,
  height,
  id,
  stackId,
  resizeable,
  style: styleProp,
  title: titleProp,
  width,
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

  const dispatch = useGridLayoutDispatch();
  // TODO pass the styleProp in here to initialise the model value
  const {
    contentDetached,
    contentVisible,
    dropTarget,
    header,
    stacked,
    title,
    ...layoutProps
  } = useGridChildProps({
    contentVisible: contentVisibleProp,
    dropTarget: dataDropTarget,
    header: headerProp,
    height,
    id,
    resizeable,
    stackId,
    style: styleProp,
    title: titleProp,
    width,
  });

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

  const useDropTargetHook = dropTarget ? useAsDropTarget : useNotDropTarget;
  const droppableProps = useDropTargetHook();
  const draggableProps = useDraggable({
    draggableClassName: classBaseItem,
    getDragSource,
    onDragStart,
  });

  console.log(`[GridLayoutItem] #${id} contentVisible ${contentVisible}`);

  const className = cx(classBaseItem, {
    "vuu-detached": contentDetached,
    "vuu-stacked": stacked && !contentDetached,
  });

  const style = {
    ...styleProp,
    ...layoutProps,
    "--header-height": header ? "25px" : "0px",
  };

  return contentVisible || contentDetached ? (
    <div
      {...htmlAttributes}
      {...draggableProps}
      {...droppableProps}
      className={cx(className)}
      id={id}
      key={id}
      style={style}
    >
      {header && !stacked ? (
        <div className={cx(`${classBaseItem}Header`)} data-drop-target="header">
          <span
            className={`${classBaseItem}Header-title vuuDraggableLabel`}
            draggable
          >
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
      <div
        className={cx(`${classBaseItem}Content`)}
        data-drop-target={dropTarget}
      >
        {children}
      </div>
    </div>
  ) : null;
};

const GridLayoutItemType = createElement(GridLayoutItem).type;
export const isGridLayoutItem = (element: ReactElement) =>
  element.type === GridLayoutItem;

GridLayoutItem.toJSON = (
  element: ReactElement<GridLayoutItemProps, typeof GridLayoutItemType>,
) => {
  const { children } = element.props;
  if (isValidElement(children)) {
    const child = componentToJson(children);
    return {
      ...child,
    } as LayoutJSON;
  } else {
    throw Error("[GridLayoutItem] children is not a react element");
  }
};
