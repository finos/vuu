import { HTMLAttributes } from "react";
import cx from "clsx";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { FilterPillNext } from "../filter-pill/FilterPillNext";
import { useSavedFilterPanel } from "./useSavedFilterPanel";

import savedFilterPanelCss from "./SavedFilterPanel.css";
import { FilterPermissions } from "../filter-pill/FilterMenu";

const classBase = "vuuSavedFilterPanel";

const filterPillPermissions: FilterPermissions = {
  allowEdit: true,
  allowRename: true,
  allowRemove: true,
};

export const SavedFilterPanel = ({
  className,
  ...htmlAttributes
}: HTMLAttributes<HTMLDivElement>) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-saved-filter-panel",
    css: savedFilterPanelCss,
    window: targetWindow,
  });

  const { onClickFilter, onFilterMenuAction, savedFilters } =
    useSavedFilterPanel();

  return (
    <div
      {...htmlAttributes}
      className={cx(classBase, "vuuScrollable", className)}
    >
      <div className={`${classBase}-filterPill-container`}>
        {savedFilters.map((filterDescriptor, i) => (
          <FilterPillNext
            {...filterDescriptor}
            key={i}
            onClick={onClickFilter}
            onMenuAction={onFilterMenuAction}
            permissions={filterPillPermissions}
          />
        ))}
      </div>
    </div>
  );
};
