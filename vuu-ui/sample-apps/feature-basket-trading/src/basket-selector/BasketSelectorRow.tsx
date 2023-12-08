import cx from "classnames";
import { RowProps } from "@finos/vuu-table";
import { MouseEvent, useCallback } from "react";

import "./BasketSelectorRow.css";

const classBase = "vuuBasketSelectorRow";

export const BasketSelectorRow = ({
  className: classNameProp,
  columnMap,
  columns,
  highlighted,
  row,
  offset,
  onClick,
  onDataEdited,
  onToggleGroup,
  zebraStripes: _,
  ...htmlAttributes
}: RowProps) => {
  const {
    [columnMap.basketId]: basketId,
    [columnMap.basketName]: basketName,
    [columnMap.status]: status,
  } = row;
  const style = { transform: `translate3d(0px, ${offset}px, 0px)` };

  const handleRowClick = useCallback(
    (evt: MouseEvent<HTMLDivElement>) => {
      const rangeSelect = evt.shiftKey;
      const keepExistingSelection = evt.ctrlKey || evt.metaKey; /* mac only */
      onClick?.(row, rangeSelect, keepExistingSelection);
    },
    [onClick, row]
  );

  return (
    <div
      {...htmlAttributes}
      aria-rowindex={row[0]}
      className={cx(classBase, "vuuTableRow", {
        [`${classBase}-highlighted`]: highlighted,
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
