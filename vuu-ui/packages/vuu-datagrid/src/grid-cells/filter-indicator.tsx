import { useContextMenu } from "@vuu-ui/ui-controls";
import { Filter, filterIncludesColumn } from "@vuu-ui/vuu-filters";
import cx from "classnames";
import { HTMLAttributes, useCallback, useMemo } from "react";

import { KeyedColumnDescriptor } from "../grid-model/gridModelTypes";
import "./filter-indicator.css";

export const Direction = {
  ASC: "asc",
  DSC: "dsc",
};

export interface FilterIndicatorProps extends HTMLAttributes<HTMLDivElement> {
  column: KeyedColumnDescriptor;
  filter?: Filter;
}

export const FilterIndicator = ({ column, filter }: FilterIndicatorProps) => {
  const hasFilter = useMemo(
    () => filter && filterIncludesColumn(filter, column),
    [filter, column]
  );
  //TODO handle this at header level
  const showContextMenu = useContextMenu();

  const handleClick = useCallback(
    (evt) => {
      // if we do this through keyboard, need to get co-ords
      evt.stopPropagation();
      showContextMenu(evt, "filter", { column, filter });
    },
    [column, filter, showContextMenu]
  );

  if (!filter || !hasFilter) {
    return null;
  }

  return (
    <div
      className={cx("hwFilterIndicator")}
      data-icon="filter"
      onClick={handleClick}
    >
      <span className="hwIconContainer" />
    </div>
  );
};
