import { Filter } from "@finos/vuu-filters";
import { Toolbar, ToolbarProps } from "@salt-ds/lab";
import cx from "classnames";
import { useFilterToolbar } from "./useFilterToolbar";
import { SuggestionConsumer } from "../filter-input";

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
