import { TableCellProps } from "@finos/vuu-datagrid-types";
import {
  isColumnTypeRenderer,
  isTypeDescriptor,
  registerComponent,
} from "@finos/vuu-utils";
import cx from "classnames";
import { CSSProperties } from "react";

import "./ProgressCell.css";

const classBase = "vuuProgressCell";

const ProgressCell = ({ column, columnMap, row }: TableCellProps) => {
  //TODO what about click handling

  const { type } = column;
  const value = row[column.key];
  let showProgress = false;
  let percentage = 0;

  if (isTypeDescriptor(type) && isColumnTypeRenderer(type.renderer)) {
    const { associatedField } = type.renderer;
    const associatedValue = row[columnMap[associatedField]];
    if (typeof value === "number" && typeof associatedValue === "number") {
      percentage = Math.min(Math.round((value / associatedValue) * 100), 100);
      showProgress = isFinite(percentage);
    } else {
      // Temp workaround for bug on server that sends aggregated values as strings
      const floatValue = parseFloat(value as string);
      if (Number.isFinite(floatValue)) {
        const floatOtherValue = parseFloat(associatedValue as string);
        if (Number.isFinite(floatOtherValue)) {
          percentage = Math.min(
            Math.round((floatValue / floatOtherValue) * 100),
            100
          );
          showProgress = isFinite(percentage);
        }
      }
    }
  }

  const className = cx(classBase, {});

  return (
    <div className={className} tabIndex={-1}>
      {showProgress ? (
        <span className={`${classBase}-track`}>
          <span className={`${classBase}-bg`} />
          <span
            className={`${classBase}-bar`}
            style={
              { "--progress-bar-pct": `-${100 - percentage}%` } as CSSProperties
            }
          />
        </span>
      ) : null}
      <span className={`${classBase}-text`}>{`${percentage} %`}</span>
    </div>
  );
};

registerComponent("vuu.progress", ProgressCell, "cell-renderer", {
  serverDataType: ["long", "int", "double"],
});
