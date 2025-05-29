import { TableCellProps } from "@vuu-ui/vuu-table-types";
import { registerComponent } from "@vuu-ui/vuu-utils";
import cx from "clsx";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { CSSProperties } from "react";

import pctProgressCellCss from "./PctProgressCell.css";

const classBase = "vuuPctProgressCell";

const getPercentageValue = (value: number) => {
  if (value >= 0 && value <= 1) {
    return value * 100;
  } else if (value > 2) {
    return 0;
  } else if (value > 1) {
    return 100;
  } else {
    return 0;
  }
};

export const PctProgressCell = ({ column, columnMap, row }: TableCellProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-pct-progress-cell",
    css: pctProgressCellCss,
    window: targetWindow,
  });

  const value = row[columnMap[column.name]] as number;
  const percentageValue = getPercentageValue(value);
  const className = cx(classBase, {});

  return (
    <div
      className={cx(className, {
        [`${classBase}-zero`]: percentageValue === 0,
        [`${classBase}-complete`]: percentageValue >= 100,
      })}
      tabIndex={-1}
    >
      <span
        className={`${classBase}-progressBar`}
        style={{ "--progress-bar-pct": `${percentageValue}%` } as CSSProperties}
      />
      <span className={`${classBase}-text`}>{`${percentageValue.toFixed(
        2,
      )} %`}</span>
    </div>
  );
};

registerComponent("vuu.pct-progress", PctProgressCell, "cell-renderer", {
  description: "Percentage formatter",
  label: "Percentage formatter",
  serverDataType: "double",
});
