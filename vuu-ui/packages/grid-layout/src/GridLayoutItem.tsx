import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { queryClosest, registerComponent } from "@vuu-ui/vuu-utils";
import cx from "clsx";
import {
  createElement,
  HTMLAttributes,
  isValidElement,
  MouseEventHandler,
  ReactElement,
  useCallback,
} from "react";
import { componentToJson, LayoutJSON } from "./componentToJson";
import {
  DragSourceProvider,
  useGridLayoutDispatch,
  useGridLayoutDragEndHandler,
  useGridLayoutDragStartHandler,
} from "./GridLayoutContext";
import {
  type GridChildItemStyle,
  type GridModelChildItemProps,
  resolveMinimumGridItemSize,
} from "./GridModel";
import { IconButton } from "./IconButton";
import { useAsDropTarget } from "./useAsDropTarget";
import { useDraggable } from "./useDraggable";
import { useGridChildProps } from "./useGridChildProps";
import { useNotDropTarget } from "./useNotDropTarget";

import gridLayoutItemCss from "./GridLayoutItem.css";

const classBaseItem = "vuuGridLayoutItem";

export interface GridLayoutItemProps
  extends Omit<GridModelChildItemProps, "contentDetached" | "style" | "type">,
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
   * style.gridArea is optional only if stackId is provided and a separate declaration
   * of a GridLayoutStackedItem child is included within GridLayout
   */
  style?: GridChildItemStyle;
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
  minHeight,
  minWidth,
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
    css: gridLayoutItemCss,
    window: targetWindow,
  });

  const dispatch = useGridLayoutDispatch();
  const modelMinHeight = resolveMinimumGridItemSize(
    minHeight,
    styleProp?.minHeight,
  );
  const modelMinWidth = resolveMinimumGridItemSize(
    minWidth,
    styleProp?.minWidth,
  );
  // TODO pass the styleProp in here to initialise the model value
  const {
    contentDetached,
    contentVisible,
    dragging,
    dropTarget,
    gridArea,
    header,
    horizontalSplitter,
    stacked,
    title,
    verticalSplitter,
  } = useGridChildProps({
    contentVisible: contentVisibleProp,
    dropTarget: dataDropTarget,
    header: headerProp,
    height,
    id,
    minHeight: modelMinHeight,
    minWidth: modelMinWidth,
    resizeable,
    stackId,
    style: styleProp,
    title: titleProp,
    width,
  });

  const onDragEnd = useGridLayoutDragEndHandler();
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
    onDragEnd,
    onDragStart,
  });

  const className = cx(classBaseItem, {
    "vuuGridLayoutItem-dragging": dragging,
    "vuu-detached": contentDetached,
    "vuu-stacked": stacked && !contentDetached,
    "has-h-splitter": horizontalSplitter,
    "has-v-splitter": verticalSplitter,
  });

  const style = {
    ...styleProp,
    gridArea,
    ...(minHeight === undefined ? {} : { minHeight }),
    ...(minWidth === undefined ? {} : { minWidth }),
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
  let { children } = element.props;
  if (Array.isArray(children)) {
    if (children.length > 1) {
      throw Error(`[GridLayoutItem] cannot have more than one child element`);
    }
    // Only happens when reconstitured from JSON
    [children] = children;
  }
  if (isValidElement(children)) {
    const child = componentToJson(children);
    return {
      ...child,
    } as LayoutJSON;
  } else {
    throw Error("[GridLayoutItem] children is not a react element");
  }
};

registerComponent("GridLayoutItem", GridLayoutItem, "component");
