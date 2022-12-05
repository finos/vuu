import { Filter } from "@finos/vuu-filters";
import { Toolbar, ToolbarProps } from "@heswell/uitk-lab";
import cx from "classnames";
import { useFilterToolbar } from "./useFilterToolbar";

export interface FilterToolbarProps extends ToolbarProps {
  filter?: Filter;
}

export const FilterToolbar = ({
  className,
  filter,
  ...props
}: FilterToolbarProps) => {
  console.log(`FilterToolbar ${JSON.stringify(filter, null, 2)}`);
  const toolbarItems = useFilterToolbar({ filter });
  return (
    <Toolbar className={cx("vuuFilterToolbar", className)} {...props}>
      {toolbarItems}
    </Toolbar>
  );
};
