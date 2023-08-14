import { NamedFilter } from "@finos/vuu-filter-types";
import { Button } from "@salt-ds/core";
import cx from "classnames";
import { TableSchema } from "@finos/vuu-data";
import { HTMLAttributes, ReactElement, useCallback, useState } from "react";
import { FilterPill } from "../filter-pill";

import "./FilterBar.css";

type filterBarMode = "edit" | "display";

export interface FilterbarProps extends HTMLAttributes<HTMLDivElement> {
  filters: NamedFilter[];
  tableSchema: TableSchema;
}

const classBase = "vuuFilterBar";

export const FilterBar = ({
  className: classNameProp,
  filters,
  tableSchema,
  ...htmlAttributes
}: FilterbarProps) => {
  const [mode, setMode] = useState<filterBarMode>("display");

  const handleAdd = useCallback(() => {
    setMode("edit");
  }, []);

  const className = cx(classBase, classNameProp, {
    [`${classBase}-display`]: mode === "display",
    [`${classBase}-edit`]: mode === "edit",
  });

  const getChildren = () => {
    if (mode === "display") {
      const items: ReactElement[] = [];
      filters.forEach((filter, i) => {
        items.push(<FilterPill filter={filter} key={`filter-${i}`} />);
      });
      items.push(
        <Button
          className={`${classBase}-add`}
          data-icon="plus"
          key="filter-add"
          onClick={handleAdd}
          variant="primary"
        />
      );
      return items;
    } else {
      return [];
    }
  };

  return (
    <div {...htmlAttributes} className={className}>
      <span className={`${classBase}-icon`} data-icon="tune" />
      {getChildren()}
    </div>
  );
};
