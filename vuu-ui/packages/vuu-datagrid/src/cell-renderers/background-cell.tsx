import React from "react";
import cx from "classnames";
import { metadataKeys } from "@vuu-ui/vuu-utils";
import { useCellFormatter } from "../grid-cells/useCellFormatter";
import useDirection, { UP1, UP2, DOWN1, DOWN2 } from "./use-direction";

import "./background-cell.css";
import { GridCellProps } from "../grid-cells";
import { ColumnType } from "../grid-model";

const CHAR_ARROW_UP = String.fromCharCode(11014);
const CHAR_ARROW_DOWN = String.fromCharCode(11015);

const { KEY } = metadataKeys;

// TODO these sre repeated from PriceFormatter - where shoud they live ?
const FlashStyle = {
  ArrowOnly: "arrow",
  BackgroundOnly: "bg-only",
  ArrowBackground: "arrow-bg",
};

const getFlashStyle = (colType?: ColumnType) => {
  if (typeof colType === "string") {
    return FlashStyle.BackgroundOnly;
  } else if (colType) {
    const { renderer } = colType;
    return (renderer && renderer.flashStyle) || FlashStyle.BackgroundOnly;
  }
};

const BackgroundCell = React.memo(function BackgroundCell({
  column,
  row,
}: GridCellProps) {
  //TODO what about click handling
  const { key, width, type } = column;
  const value = row[key];
  const [format] = useCellFormatter(column);
  const flashStyle = getFlashStyle(type);
  const direction = useDirection(row[KEY], value, column);
  const arrow =
    flashStyle === FlashStyle.ArrowOnly ||
    flashStyle === FlashStyle.ArrowBackground
      ? direction === UP1 || direction === UP2
        ? CHAR_ARROW_UP
        : direction === DOWN1 || direction === DOWN2
        ? CHAR_ARROW_DOWN
        : null
      : null;

  const dirClass = direction ? ` ` + direction : "";
  const arrowClass =
    flashStyle === FlashStyle.ArrowOnly
      ? " arrow-only"
      : flashStyle === FlashStyle.ArrowBackground
      ? " arrow"
      : "";

  return (
    <div
      className={cx("vuuDataGridCell", "Background-cell", dirClass, arrowClass)}
      style={{ marginLeft: column.marginLeft, width }}
      tabIndex={-1}
    >
      <div className="flasher">{arrow}</div>
      {format(row[column.key])}
    </div>
  );
});

export default BackgroundCell;
