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

import "./GridLayout.css";
import "./GridSplitter.css";

import {
  GridLayoutProvider,
  ISplitter,
  useGridLayoutProviderDispatch,
} from "@finos/vuu-layout";
import { ResizeOrientation } from "@finos/vuu-layout/src/grid-layout/grid-dom-utils";

const classBase = "vuuGridLayout";
const classBaseItem = "vuuGridLayoutItem";

export type GridResizeable = "h" | "v" | "hv";

export interface GridSplitterProps
  extends Pick<ISplitter, "align">,
    HTMLAttributes<HTMLDivElement> {
  "aria-controls": string;
  orientation: ResizeOrientation;
}

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
  children: ReactElement<GridLayoutItemProps>[];
  colCount: number;
  layoutAPI?: ForwardedRef<LayoutAPI>;
  rowCount: number;
  rows?: (string | number)[];
}

export interface GridLayoutItemProps extends HTMLAttributes<HTMLDivElement> {
  header?: boolean;
  id: string;
  label?: string;
  resizeable?: GridResizeable;
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
    "--header-height": header ? "25px" : "0px",
  };

  return (
    <div {...htmlAttributes} className={className} id={id} style={style}>
      {header ? (
        <div className={`${classBaseItem}Header`}>
          <span className={`${classBaseItem}Header-title`}>{title}</span>
          <span
            className={`${classBaseItem}Header-close`}
            data-icon="close"
            onClick={onClose}
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
    gridTemplateRows,
    splitGridCol,
    splitGridRow,
    containerRef,
    splitters,
    ...layoutProps
  } = useGridSplitterResizing({
    children: childrenProp,
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
    gridTemplateRows,
    ...styleProp,
  } as CSSProperties;

  return (
    <GridLayoutProvider dispatchGridLayoutAction={dispatchGridLayoutAction}>
      <div
        {...htmlAttributes}
        {...layoutProps}
        ref={containerRef}
        style={style}
        className={cx(classBase, className)}
      >
        {children}
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
