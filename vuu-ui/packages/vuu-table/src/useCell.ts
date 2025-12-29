import { RuntimeColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { getColumnStyle } from "@vuu-ui/vuu-utils";
import cx from "clsx";
import { useMemo } from "react";

export const useCell = (
  column: RuntimeColumnDescriptor,
  classBase: string,
  isHeader?: boolean,
  hasError?: boolean,
) =>
  // TODO measure perf without the memo, might not be worth the cost
  useMemo(() => {
    const className = cx(classBase, column.className, {
      vuuPinLeft: column.pin === "left",
      vuuPinRight: column.pin === "right",
      vuuEndPin: isHeader && column.pinnedWidth,
      [`${classBase}-editable`]: column.editable,
      [`${classBase}-right`]: column.align === "right",
      [`${classBase}-error`]: hasError,
    });

    const style = getColumnStyle(column);
    return {
      className,
      style,
    };
  }, [classBase, column, isHeader, hasError]);
