import cx from "classnames";
import { RowProps } from "@finos/vuu-table";
import { MouseEvent, useCallback } from "react";

import "./BasketSelectorRow.css";

const classBase = "vuuBasketSelectorRow";

export const BasketSelectorRow = ({
  className: classNameProp,
  columnMap,
  columns,
  row,
  offset,
  onClick,
  onDataEdited,
  onToggleGroup,
  zebraStripes = false,
  ...htmlAttributes
}: RowProps) => {
  const name = row[columnMap.name];
  const symbolName = row[columnMap.symbolName];
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
      className={cx(classBase, "vuuTableNextRow")}
      onClick={handleRowClick}
      role="row"
      style={style}
    >
      <div className="vuuTableNextCell" role="cell">
        <span className={`${classBase}-name`}>{name}</span>
        <span></span>
        <div className={`${classBase}-symbol`}>
          <label className={`${classBase}-status`}>Symbol</label>
          <span className={`${classBase}-symbolName`}>{symbolName}</span>
        </div>
      </div>
    </div>
  );
};
