import type { RowProps } from "@finos/vuu-table-types";
import { metadataKeys } from "@finos/vuu-utils";
import cx from "clsx";
import { MouseEvent, useCallback } from "react";

import "./BasketSelectorRow.css";

const classBase = "vuuBasketSelectorRow";

const { SELECTED } = metadataKeys;

export const BasketSelectorRow = ({
  classNameGenerator: _ignore1,
  virtualColSpan: _ignore2,
  zebraStripes: _ignore3,
  className: classNameProp,
  columnMap,
  columns,
  highlighted,
  row,
  offset,
  onClick,
  onDataEdited,
  onToggleGroup,
  ...htmlAttributes
}: RowProps) => {
  const {
    [columnMap.basketId]: basketId,
    [columnMap.basketName]: basketName,
    [columnMap.status]: status,
    [SELECTED]: selectionStatus,
  } = row;
  const style = { transform: `translate3d(0px, ${offset}px, 0px)` };

  const handleRowClick = useCallback(
    (evt: MouseEvent<HTMLDivElement>) => {
      const rangeSelect = evt.shiftKey;
      const keepExistingSelection = evt.ctrlKey || evt.metaKey; /* mac only */
      onClick?.(evt, row, rangeSelect, keepExistingSelection);
    },
    [onClick, row]
  );

  return (
    <div
      {...htmlAttributes}
      className={cx(classBase, "vuuTableRow", {
        [`${classBase}-highlighted`]: highlighted,
        [`${classBase}-selected`]: selectionStatus !== 0,
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
