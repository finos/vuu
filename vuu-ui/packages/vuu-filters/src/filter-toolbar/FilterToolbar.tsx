import { Filter } from "@finos/vuu-utils";
import { Toolbar, ToolbarProps } from "@heswell/uitk-lab";
import cx from "classnames";

export interface FilterToolbarProps extends ToolbarProps {
  filter: Filter;
}

export const FilterToolbar = ({
  className,
  filter,
  ...props
}: FilterToolbarProps) => {
  console.log(`FilterToolbar`, {
    filter,
  });
  return <Toolbar className={cx("vuuFilterToolbar", className)} {...props} />;
};
