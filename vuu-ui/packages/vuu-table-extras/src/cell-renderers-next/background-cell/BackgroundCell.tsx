import { ColumnType, TableCellProps } from "@finos/vuu-datagrid-types";
import {
  DOWN1,
  DOWN2,
  isTypeDescriptor,
  metadataKeys,
  registerComponent,
  UP1,
  UP2,
} from "@finos/vuu-utils";
import cx from "classnames";
import { useDirection } from "./useDirection";

import "./BackgroundCell.css";
import "./FlashingBackground.css";

const CHAR_ARROW_UP = String.fromCharCode(11014);
const CHAR_ARROW_DOWN = String.fromCharCode(11015);

const { KEY } = metadataKeys;

const classBase = "vuuBackgroundCell";

// TODO these sre repeated from PriceFormatter - where shoud they live ?
const FlashStyle = {
  ArrowOnly: "arrow",
  BackgroundOnly: "bg-only",
  ArrowBackground: "arrow-bg",
};

const getFlashStyle = (colType?: ColumnType) => {
  if (isTypeDescriptor(colType) && colType.renderer) {
    if ("flashStyle" in colType.renderer) {
      return colType.renderer["flashStyle"];
    }
  }
  return FlashStyle.BackgroundOnly;
};

// export to avoid tree shaking, component is not consumed directly
export const BackgroundCell = ({ column, row }: TableCellProps) => {
  //TODO what about click handling

  const { key, type, valueFormatter } = column;
  const value = row[key];
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

  const className = cx(classBase, dirClass, {
    [`${classBase}-arrowOnly`]: flashStyle === FlashStyle.ArrowOnly,
    [`${classBase}-arrowBackground`]: flashStyle === FlashStyle.ArrowBackground,
  });

  return (
    <div className={className} tabIndex={-1}>
      <div className={`${classBase}-flasher`}>{arrow}</div>
      {valueFormatter(row[column.key])}
    </div>
  );
};

registerComponent("background-next", BackgroundCell, "cell-renderer", {
  description: "Change background color of cell when value changes",
  label: "Background Flash",
  serverDataType: ["long", "int", "double"],
});
