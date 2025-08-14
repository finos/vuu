import { HTMLAttributes } from "react";
import cx from "clsx";
import { Filter } from "@vuu-ui/vuu-filter-types";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { FilterPill } from "../filter-pill";

import savedFilterPanelCss from "./SavedFilterPanel.css";

const classBase = "vuuSavedFilterPanel";

export interface SavedFilterPanelProps extends HTMLAttributes<HTMLDivElement> {
  filterDescriptors: Filter[];
}

export const SavedFilterPanel = ({
  className,
  filterDescriptors,
  ...htmlAttributes
}: SavedFilterPanelProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-saved-filter-panel",
    css: savedFilterPanelCss,
    window: targetWindow,
  });

  return (
    <div {...htmlAttributes} className={cx(classBase, className)}>
      {filterDescriptors.map((filter, i) => (
        <FilterPill
          allowClose={false}
          filter={filter}
          key={i}
          selected={false}
        />
      ))}
    </div>
  );
};
