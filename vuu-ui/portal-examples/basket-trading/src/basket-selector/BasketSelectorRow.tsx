import type { RowProps } from "@vuu-ui/vuu-table-types";
import cx from "clsx";
import { MouseEvent, useCallback } from "react";

import "./BasketSelectorRow.css";

const classBase = "vuuBasketSelectorRow";

export const BasketSelectorRow = ({
  classNameGenerator: _ignore1,
  virtualColSpan: _ignore2,
  zebraStripes: _ignore3,
  className: classNameProp,
  columns,
  dataRow,
  highlighted,
  offset,
  onClick,
  onDataEdited,
  onToggleGroup,
  ...htmlAttributes
}: RowProps) => {
  const { basketId, basketName, status, isSelected } = dataRow;
  const style = { transform: `translate3d(0px, ${offset}px, 0px)` };

  const handleRowClick = useCallback(
    (evt: MouseEvent<HTMLDivElement>) => {
      const rangeSelect = evt.shiftKey;
      const keepExistingSelection = evt.ctrlKey || evt.metaKey; /* mac only */
      onClick?.(evt, dataRow, rangeSelect, keepExistingSelection);
    },
    [onClick, dataRow],
  );

  return (
    <div
      {...htmlAttributes}
      className={cx(classBase, "vuuTableRow", {
        [`${classBase}-highlighted`]: highlighted,
        [`${classBase}-selected`]: isSelected,
      })}
      onClick={handleRowClick}
      role="row"
      style={style}
    >
      <div className="vuuTableCell" role="cell">
        <span className={`${classBase}-name`}>{basketName}</span>
        {status === "ON_MARKET" ? (
          <label className={`${classBase}-status`}>
            {status === "ON_MARKET" ? "ON MARKET" : ""}
          </label>
        ) : (
          <span />
        )}
        <div className={`${classBase}-symbolContainer`}>
          <label className={`${classBase}-symbolLabel`}>Symbol</label>
          <span className={`${classBase}-basketId`}>{basketId}</span>
        </div>
        <span></span>
        <div className={`${classBase}-symbol`}></div>
      </div>
    </div>
  );
};
