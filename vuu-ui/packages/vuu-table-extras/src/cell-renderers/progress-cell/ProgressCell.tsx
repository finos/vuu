import { TableCellProps } from "@vuu-ui/vuu-table-types";
import {
  isColumnTypeRenderer,
  isTypeDescriptor,
  isValidNumber,
  registerComponent,
} from "@vuu-ui/vuu-utils";
import cx from "clsx";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { CSSProperties } from "react";

import progressCellCss from "./ProgressCell.css";

const classBase = "vuuProgressCell";

const ProgressCell = ({ column, columnMap, row }: TableCellProps) => {
  //TODO what about click handling
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-progress-cell",
    css: progressCellCss,
    window: targetWindow,
  });

  const { name, type } = column;
  const value = row[columnMap[name]];
  let showProgress = false;
  let percentage = 0;

  if (isTypeDescriptor(type) && isColumnTypeRenderer(type.renderer)) {
    const { associatedField } = type.renderer;
    if (associatedField) {
      const associatedValue = row[columnMap[associatedField]];
      if (isValidNumber(value) && isValidNumber(associatedValue)) {
        percentage = Math.min(Math.round((value / associatedValue) * 100), 100);
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
              100,
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
  description: "Progress formatter",
  label: "Progress formatter",
  serverDataType: ["long", "int", "double"],
  // Not until we provide settings for associaetd field
  userCanAssign: false,
});
