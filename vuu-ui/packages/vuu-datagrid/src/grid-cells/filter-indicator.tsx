import { useContextMenu } from "@finos/vuu-popups";
import { Filter } from "@finos/vuu-filter-types";
import { filterIncludesColumn } from "@finos/vuu-filters";
import cx from "classnames";
import { HTMLAttributes, useCallback, useMemo } from "react";

import "./filter-indicator.css";
import { RuntimeColumnDescriptor } from "@finos/vuu-datagrid-types";

export const Direction = {
  ASC: "asc",
  DSC: "dsc",
};

export interface FilterIndicatorProps extends HTMLAttributes<HTMLDivElement> {
  column: RuntimeColumnDescriptor;
  filter?: Filter;
}

export const FilterIndicator = ({ column, filter }: FilterIndicatorProps) => {
  const hasFilter = useMemo(
    () => filter && filterIncludesColumn(filter, column),
    [filter, column]
  );
  //TODO handle this at header level
  const [showContextMenu] = useContextMenu();

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
