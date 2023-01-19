import { KeyedColumnDescriptor } from "@finos/vuu-datagrid-types";
import { Filter } from "@finos/vuu-filter-types";
import { useContextMenu } from "@finos/vuu-popups";
import cx from "classnames";
import { HTMLAttributes, useCallback } from "react";

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

  if (!column.filter) {
    return null;
  }

  return (
    <div
      className={cx("vuuFilterIndicator")}
      data-icon="filter"
      onClick={handleClick}
    />
  );
};
