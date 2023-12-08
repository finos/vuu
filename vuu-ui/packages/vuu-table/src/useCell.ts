import { RuntimeColumnDescriptor } from "@finos/vuu-datagrid-types";
import { getColumnStyle } from "@finos/vuu-utils";
import cx from "classnames";
import { useMemo } from "react";

export const useCell = (
  column: RuntimeColumnDescriptor,
  classBase: string,
  isHeader?: boolean
) =>
  // TODO measure perf without the memo, might not be worth the cost
  useMemo(() => {
    const className = cx(classBase, {
      vuuPinFloating: column.pin === "floating",
      vuuPinLeft: column.pin === "left",
      vuuPinRight: column.pin === "right",
      vuuEndPin: isHeader && column.endPin,
      // [`${classBase}-resizing`]: column.resizing,
      [`${classBase}-editable`]: column.editable,
      [`${classBase}-right`]: column.align === "right",
    });

    const style = getColumnStyle(column);
    return {
      className,
      style,
    };
  }, [column, classBase, isHeader]);
