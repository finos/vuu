import { Filter } from "@finos/vuu-filter-types";
import { Toolbar, ToolbarProps } from "@heswell/salt-lab";
import cx from "classnames";
import { SuggestionConsumer } from "../filter-input";
import { useFilterToolbar } from "./useFilterToolbar";

import "./FilterToolbar.css";

export interface FilterToolbarProps extends SuggestionConsumer, ToolbarProps {
  filter?: Filter;
}

export const FilterToolbar = ({
  className,
  filter,
  suggestionProvider,
  ...props
}: FilterToolbarProps) => {
  console.log(`FilterToolbar ${JSON.stringify(filter, null, 2)}`);
  const toolbarItems = useFilterToolbar({ filter, suggestionProvider });
  return (
    <Toolbar className={cx("vuuFilterToolbar", className)} {...props}>
      {toolbarItems}
    </Toolbar>
  );
};
