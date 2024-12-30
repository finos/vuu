import { RefCallback, useCallback, useEffect, useMemo, useRef } from "react";
import { GridModel, GridModelConstructorProps } from "./GridModel";

export type GridLayoutHookProps = Pick<
  GridModelConstructorProps,
  "colCount" | "cols" | "rowCount" | "rows"
>;

/**
 * In this hook we create the GridModel and bind model changes to DOM changes
 */
export const useGridLayout = ({
  colCount,
  cols,
  rowCount,
  rows,
}: GridLayoutHookProps) => {
  const containerRef = useRef<HTMLDivElement>();

  const [gridModel, containerCallback] = useMemo(
    // TODO handling runtime change of cols, rows etc currently not supported
    () => {
      const gridModel = new GridModel({ cols, colCount, rows, rowCount });
      const callbackRef: RefCallback<HTMLDivElement> = (el) => {
        if (el) {
          containerRef.current = el;
          gridModel.setRowsAndCols(el);
        }
      };

      return [gridModel, callbackRef];
    },
    [colCount, cols, rowCount, rows],
  );

  const updateGridTemplateColumns = useCallback((columns: number[]) => {
    if (containerRef.current) {
      const trackTemplate = columns.map((r) => `${r}px`).join(" ");
      containerRef.current.style.gridTemplateColumns = trackTemplate;
    }
  }, []);

  const updateGridTemplateRows = useCallback((rows: number[]) => {
    if (containerRef.current) {
      const trackTemplate = rows.map((r) => `${r}px`).join(" ");
      containerRef.current.style.gridTemplateRows = trackTemplate;
    }
  }, []);

  useEffect(() => {
    gridModel.addListener("grid-template-columns", updateGridTemplateColumns);
    gridModel.addListener("grid-template-rows", updateGridTemplateRows);

    return () => {
      gridModel.removeListener(
        "grid-template-columns",
        updateGridTemplateColumns,
      );
      gridModel.removeListener("grid-template-rows", updateGridTemplateRows);
    };
  }, [gridModel, updateGridTemplateColumns, updateGridTemplateRows]);

  return {
    containerCallback,
    containerRef,
    gridModel,
  };
};
