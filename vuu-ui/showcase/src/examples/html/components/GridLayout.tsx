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
import { useDragDrop } from "./useDragDrop";

import "./GridLayout.css";
import "./GridPlaceholder.css";
import "./GridSplitter.css";

import {
  GridLayoutProvider,
  ISplitter,
  useGridLayoutProps,
  useGridLayoutProviderDispatch,
} from "@finos/vuu-layout";
import { ResizeOrientation } from "@finos/vuu-layout/src/grid-layout/grid-dom-utils";
import { IconButton } from "@finos/vuu-ui-controls";

const classBase = "vuuGridLayout";
const classBaseItem = "vuuGridLayoutItem";

export type GridResizeable = "h" | "v" | "hv";

export interface GridSplitterProps
  extends Pick<ISplitter, "align">,
    HTMLAttributes<HTMLDivElement> {
  "aria-controls": string;
  orientation: ResizeOrientation;
}

export interface GridPlaceholderProps extends HTMLAttributes<HTMLDivElement> {
  debugLabel?: string;
}

export const GridPlaceholder = ({
  debugLabel,
  ...htmlAttributes
}: GridPlaceholderProps) => {
  return <div {...htmlAttributes} className="vuuGridPlaceholder" />;
};

export const GridSplitter = ({
  align,
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
      data-align={align}
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
  extends Omit<HTMLAttributes<HTMLDivElement>, "style"> {
  header?: boolean;
  id: string;
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
  resizeable,
  style: styleProp,
  title,
  ...htmlAttributes
}: GridLayoutItemProps) => {
  const dispatch = useGridLayoutProviderDispatch();
  const layoutProps = useGridLayoutProps(id);
  const dragProps = useDragDrop();
  const onClose = useCallback(() => {
    dispatch({
      type: "close",
      id,
    });
  }, [dispatch, id]);

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
    <div {...htmlAttributes} className={className} id={id} style={style}>
      {header ? (
        <div className={`${classBaseItem}Header`} {...dragProps} draggable>
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
  rowCount,
  rows,
  style: styleProp,
  ...htmlAttributes
}: GridLayoutProps) => {
  const {
    children,
    dispatchGridLayoutAction,
    gridTemplateColumns,
    gridTemplateRows,
    layoutMap,
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
    rowCount,
    rows,
  });

  useImperativeHandle(
    layoutAPI,
    () => ({
      splitGridCol,
      splitGridRow,
    }),
    [splitGridCol, splitGridRow]
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
            align={splitter.align}
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
