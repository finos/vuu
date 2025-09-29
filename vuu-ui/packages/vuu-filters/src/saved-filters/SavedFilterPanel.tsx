import { HTMLAttributes, useMemo } from "react";
import cx from "clsx";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { FilterPillNext } from "../filter-pill/FilterPillNext";
import { useSavedFilterPanel } from "./useSavedFilterPanel";

import savedFilterPanelCss from "./SavedFilterPanel.css";
import { FilterPermissions } from "../filter-pill/FilterMenu";
import { filterDescriptorHasFilter } from "../filter-provider/FilterProvider";

const classBase = "vuuSavedFilterPanel";

const defaultFilterPillPermissions: FilterPermissions = {
  allowEdit: true,
  allowRename: true,
  allowRemove: true,
};

export const SavedFilterPanel = ({
  className,
  filterPillPermissions = defaultFilterPillPermissions,
  ...htmlAttributes
}: HTMLAttributes<HTMLDivElement> & {
  filterPillPermissions?: FilterPermissions;
}) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-saved-filter-panel",
    css: savedFilterPanelCss,
    window: targetWindow,
  });

  const permissions = useMemo<FilterPermissions>(() => {
    const {
      allowClose = defaultFilterPillPermissions.allowClose,
      allowEdit = defaultFilterPillPermissions.allowEdit,
      allowRemove = defaultFilterPillPermissions.allowRename,
      allowRename = defaultFilterPillPermissions.allowRename,
    } = filterPillPermissions;
    return { allowClose, allowEdit, allowRemove, allowRename };
  }, [filterPillPermissions]);

  const { onClickFilter, onFilterMenuAction, savedFilters } =
    useSavedFilterPanel();

  const filtersToDisplay = savedFilters.filter(filterDescriptorHasFilter);

  return (
    <div
      {...htmlAttributes}
      className={cx(classBase, "vuuScrollable", className)}
    >
      <div className={`${classBase}-filterPill-container`}>
        {filtersToDisplay.map((filterDescriptor, i) => (
          <FilterPillNext
            {...filterDescriptor}
            key={i}
            onClick={onClickFilter}
            onMenuAction={onFilterMenuAction}
            permissions={permissions}
          />
        ))}
      </div>
    </div>
  );
};
