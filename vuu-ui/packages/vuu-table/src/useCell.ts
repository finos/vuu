import { RuntimeColumnDescriptor } from "@finos/vuu-table-types";
import { getColumnStyle } from "@finos/vuu-utils";
import cx from "clsx";
import { useMemo } from "react";

export const useCell = (
  column: RuntimeColumnDescriptor,
  classBase: string,
  isHeader?: boolean,
) =>
  // TODO measure perf without the memo, might not be worth the cost
  useMemo(() => {
    const className = cx(classBase, column.className, {
      vuuPinFloating: column.pin === "floating",
      vuuPinLeft: column.pin === "left",
      vuuPinRight: column.pin === "right",
      vuuEndPin: isHeader && column.endPin,
      [`${classBase}-editable`]: column.editable,
      [`${classBase}-right`]: column.align === "right",
    });

    const style = getColumnStyle(column);
    return {
      className,
      style,
    };
  }, [column, classBase, isHeader]);
