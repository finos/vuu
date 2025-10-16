import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import cx from "clsx";
import { HTMLAttributes, useMemo } from "react";
import { FilterPermissions } from "../filter-pill/FilterMenu";
import { FilterPillNext } from "../filter-pill/FilterPillNext";
import { useSavedFilterPanel } from "./useSavedFilterPanel";

import savedFilterPanelCss from "./SavedFilterPanel.css";
import { FilterContainerProps } from "../filter-container/FilterContainer";

const classBase = "vuuSavedFilterPanel";

const defaultFilterPillPermissions: FilterPermissions = {
  allowEdit: true,
  allowRename: true,
  allowRemove: true,
};

export interface SavedFilterPanelProps
  extends HTMLAttributes<HTMLDivElement>,
    Pick<FilterContainerProps, "filterProviderKey"> {
  /**
   * ColumnDescriptors are not required but is passed will be
   * used to provide labels and correct value formatting for
   * displayed filters, e.g in tooltips
   */
  availableColumns?: ColumnDescriptor[];
  filterPillPermissions?: FilterPermissions;
}

export const SavedFilterPanel = ({
  availableColumns,
  className,
  filterPillPermissions = defaultFilterPillPermissions,
  filterProviderKey,
  ...htmlAttributes
}: SavedFilterPanelProps) => {
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
    useSavedFilterPanel({ availableColumns, filterProviderKey });

  return (
    <div
      {...htmlAttributes}
      className={cx(classBase, "vuuScrollable", className)}
    >
      <div className={`${classBase}-filterPill-container`}>
        {savedFilters.map((filterDescriptor, i) => (
          <FilterPillNext
            {...filterDescriptor}
            columns={availableColumns}
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
