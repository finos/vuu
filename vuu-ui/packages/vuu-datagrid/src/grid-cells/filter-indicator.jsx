import React, { useCallback, useMemo } from "react";
import cx from "classnames";
import { filterIncludesColumn } from "@finos/vuu-utils";
import { useContextMenu } from "@finos/ui-controls";

import "./filter-indicator.css";

export const Direction = {
  ASC: "asc",
  DSC: "dsc",
};

export const FilterIndicator = ({ column, filter }) => {
  const hasFilter = useMemo(
    () => filterIncludesColumn(filter, column),
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
