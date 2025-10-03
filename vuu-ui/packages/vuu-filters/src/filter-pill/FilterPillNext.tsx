import { Button, Tooltip } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { HTMLAttributes } from "react";
import { FilterMenu, type FilterPermissions } from "./FilterMenu";
import {
  type FilterPillNextHookProps,
  useFilterPillNext,
} from "./useFilterPillNext";

import filterPillNextCss from "./FilterPillNext.css";
import { FilterDisplay } from "../filter-display/FilterDisplay";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";

export interface FilterPillNextProps
  extends FilterPillNextHookProps,
    Omit<HTMLAttributes<HTMLButtonElement>, "id"> {
  /**
   * If provided, these will be used in tooltip to provide
   * richer representation of filter.
   */
  columns?: ColumnDescriptor[];
  id: string;
  permissions?: FilterPermissions;
  showTooltip?: boolean;
}

const classBase = "vuuFilterPillNext";

export const FilterPillNext = ({
  active,
  appearence,
  columns,
  className,
  defaultActive,
  filter,
  id,
  onClick,
  onMenuAction: onMenuActionProp,
  permissions,
  showTooltip = true,
  ...htmlAttributes
}: FilterPillNextProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-filter-pill",
    css: filterPillNextCss,
    window: targetWindow,
  });

  const {
    contextMenuOpen,
    onContextMenu,
    onContextMenuOpenChange,
    onMenuAction,
    virtualElement,
  } = useFilterPillNext({
    active,
    appearence,
    defaultActive,
    filter,
    onMenuAction: onMenuActionProp,
  });

  const filterPill = (
    <Button
      {...htmlAttributes}
      appearance="solid"
      className={cx(classBase, className, {
        [`${classBase}-active`]: active,
      })}
      id={id}
      onClick={onClick}
      onContextMenu={onContextMenu}
      sentiment="accented"
    >
      {filter.name}
    </Button>
  );

  const filterMenu = (
    <FilterMenu
      filterId={id}
      getVirtualElement={() => virtualElement}
      onMenuAction={onMenuAction}
      onOpenChange={onContextMenuOpenChange}
      open={contextMenuOpen}
      permissions={permissions}
    />
  );

  return showTooltip ? (
    <>
      <Tooltip
        className={`${classBase}-tooltip`}
        content={<FilterDisplay columns={columns} filter={filter} />}
        placement="top"
      >
        {filterPill}
      </Tooltip>
      {filterMenu}
    </>
  ) : (
    <>
      {filterPill}
      {filterMenu}
    </>
  );
};
