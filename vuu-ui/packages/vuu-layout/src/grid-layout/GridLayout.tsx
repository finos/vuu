import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import {
  CSSProperties,
  ForwardedRef,
  HTMLAttributes,
  ReactElement,
  useCallback,
  useImperativeHandle,
} from "react";
import { useGridSplitterResizing } from "./useGridSplitterResizing";

import gridLayoutCss from "./GridLayout.css";
import gridSplitterCss from "./GridSplitter.css";

import {
  GridLayoutProvider,
  GridPlaceholder,
  ResizeOrientation,
  useGridLayoutProps,
  useGridLayoutProviderDispatch,
} from "@finos/vuu-layout";
import { IconButton } from "@finos/vuu-ui-controls";
import { useAsDropTarget } from "./useAsDropTarget";
import { useNotDropTarget } from "./useNotDropTarget";

const classBase = "vuuGridLayout";
const classBaseItem = "vuuGridLayoutItem";

export type GridResizeable = "h" | "v" | "hv";

export interface GridSplitterProps extends HTMLAttributes<HTMLDivElement> {
  "aria-controls": string;
  orientation: ResizeOrientation;
}

export const GridSplitter = ({
  "aria-controls": ariaControls,
  orientation,
  ...htmlAttributes
}: GridSplitterProps) => {
  const id = `${ariaControls}-splitter-${orientation[0]}`;
  return (
    <div
      {...htmlAttributes}
      aria-controls={ariaControls}
      className={cx("vuuGridSplitter", `vuuGridSplitter-${orientation}`)}
      id={id}
      role="separator"
    />
  );
};

export interface GridLayoutProps extends HTMLAttributes<HTMLDivElement> {
  children?:
    | ReactElement<GridLayoutItemProps>
    | ReactElement<GridLayoutItemProps>[];
  colCount?: number;
  cols?: (string | number)[];
  layoutAPI?: ForwardedRef<LayoutAPI>;
  rowCount?: number;
  rows?: (string | number)[];
}

export interface GridLayoutItemProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onDrop" | "style"> {
  header?: boolean;
  id: string;
  isDropTarget?: boolean;
  label?: string;
  resizeable?: GridResizeable;
  style: CSSProperties & {
    gridColumnEnd: number;
    gridColumnStart: number;
    gridRowEnd: number;
    gridRowStart: number;
  };
}

export const GridLayoutItem = ({
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
    window: targetWindow,
  });
  useComponentCssInjection({
    testId: "vuu-grid-splitter",
    css: gridSplitterCss,
    window: targetWindow,
  });

  const dispatch = useGridLayoutProviderDispatch();
  const layoutProps = useGridLayoutProps(id);

  const onClose = useCallback(() => {
    dispatch({ type: "close", id });
  }, [dispatch, id]);

  const useDrop = isDropTarget ? useAsDropTarget : useNotDropTarget;

  const { dropTargetClassName, ...dropHandlers } = useDrop();

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
      {...dropHandlers}
      className={cx(className, dropTargetClassName)}
      id={id}
      key={id}
      style={style}
    >
      {header ? (
        <div className={cx(`${classBaseItem}Header`)} draggable>
          <span className={`${classBaseItem}Header-title`}>{title}</span>
          <IconButton
            className={`${classBaseItem}Header-close`}
            icon="close"
            onClick={onClose}
            variant="secondary"
          />
        </div>
      ) : null}
      {children}
    </div>
  );
};

export interface LayoutAPI {
  addGridColumn: (id: string) => void;
  addGridRow: (id: string) => void;
  removeGridColumn: (trackIndex: number) => void;
  splitGridCol: (id: string) => void;
  splitGridRow: (id: string) => void;
}

export const GridLayout = ({
  id,
  children: childrenProp,
  colCount,
  cols,
  className,
  layoutAPI,
  onClick,
  rowCount,
  rows,
  style: styleProp,
  ...htmlAttributes
}: GridLayoutProps) => {
  const {
    addGridColumn,
    addGridRow,
    children,
    dispatchGridLayoutAction,
    gridTemplateColumns,
    gridTemplateRows,
    layoutMap,
    onDrop,
    removeGridColumn,
    splitGridCol,
    splitGridRow,
    containerRef,
    nonContentGridItems: { placeholders, splitters },
    ...layoutProps
  } = useGridSplitterResizing({
    children: childrenProp,
    colCount,
    cols,
    id,
    onClick,
    rowCount,
    rows,
  });

  useImperativeHandle(
    layoutAPI,
    () => ({
      addGridColumn,
      addGridRow,
      removeGridColumn,
      splitGridCol,
      splitGridRow,
    }),
    [addGridColumn, addGridRow, removeGridColumn, splitGridCol, splitGridRow]
  );

  const style = {
    "--col-count": colCount,
    "--row-count": rowCount,
    gridTemplateColumns,
    gridTemplateRows,
    ...styleProp,
  } as CSSProperties;

  return (
    <GridLayoutProvider
      dispatchGridLayoutAction={dispatchGridLayoutAction}
      layoutMap={layoutMap}
      onDrop={onDrop}
    >
      <div
        {...htmlAttributes}
        {...layoutProps}
        ref={containerRef}
        style={style}
        className={cx(classBase, className)}
      >
        {children}
        {placeholders.map((placeholder) => (
          <GridPlaceholder
            id={placeholder.id}
            key={placeholder.id}
            style={{
              gridColumn: `${placeholder.column.start}/${placeholder.column.end}`,
              gridRow: `${placeholder.row.start}/${placeholder.row.end}`,
            }}
          />
        ))}
        {splitters.map((splitter) => (
          <GridSplitter
            aria-controls={splitter.controls}
            id={splitter.id}
            key={splitter.id}
            orientation={splitter.orientation}
            style={{
              gridColumn: `${splitter.column.start}/${splitter.column.end}`,
              gridRow: `${splitter.row.start}/${splitter.row.end}`,
            }}
          />
        ))}
      </div>
    </GridLayoutProvider>
  );
};
