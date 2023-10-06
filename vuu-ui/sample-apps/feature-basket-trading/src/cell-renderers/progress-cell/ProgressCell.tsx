import { TableCellProps } from "@finos/vuu-datagrid-types";
import {
  isColumnTypeRenderer,
  isTypeDescriptor,
  isValidNumber,
  registerComponent,
} from "@finos/vuu-utils";
import cx from "classnames";
import { CSSProperties } from "react";

import "./ProgressCell.css";

const classBase = "vuuBasketProgressCell";

const ProgressCell = ({ column, columnMap, row }: TableCellProps) => {
  const { type } = column;
  const value = row[column.key];
  let showProgress = false;
  let percentage = 0;

  if (isTypeDescriptor(type) && isColumnTypeRenderer(type.renderer)) {
    const { associatedField } = type.renderer;
    if (associatedField) {
      const associatedValue = row[columnMap[associatedField]];
      if (isValidNumber(value) && isValidNumber(associatedValue)) {
        percentage = Math.min((value / associatedValue) * 100, 100);
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
    } else {
      throw Error("ProgressCell associatedField is required to render");
    }
  }

  const className = cx(classBase, {});

  return (
    <div className={className} tabIndex={-1}>
      {showProgress ? (
        <span
          className={`${classBase}-progressBar`}
          style={{ "--progress-bar-pct": `${percentage}%` } as CSSProperties}
        />
      ) : null}
      <span className={`${classBase}-text`}>{`${percentage.toFixed(
        2
      )} %`}</span>
    </div>
  );
};

registerComponent("basket-progress", ProgressCell, "cell-renderer", {
  description: "Progress formatter",
  label: "Progress formatter",
  serverDataType: ["long", "int", "double"],
});
