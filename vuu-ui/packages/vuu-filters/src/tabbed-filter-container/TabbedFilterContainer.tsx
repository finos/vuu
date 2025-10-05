import {
  TabListNext,
  TabNext,
  TabNextPanel,
  TabNextTrigger,
  TabsNext,
} from "@salt-ds/lab";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import type { HTMLAttributes, ReactNode } from "react";
import { FilterContainerProps } from "../filter-container/FilterContainer";
import { FilterPanel } from "../filter-panel/FilterPanel";
import {
  SavedFilterPanel,
  SavedFilterPanelProps,
} from "../saved-filters/SavedFilterPanel";
import tabbedFilterContainerCss from "./TabbedFilterContainer.css";

const classBase = "vuuTabbedFilterContainer";

export interface TabbedFilterContainerProps
  extends HTMLAttributes<HTMLDivElement>,
    Pick<
      FilterContainerProps,
      "filter" | "onFilterApplied" | "onFilterCleared"
    >,
    Pick<SavedFilterPanelProps, "availableColumns"> {
  children: ReactNode;
}

export const TabbedFilterContainer = ({
  availableColumns,
  children,
  className,
  filter,
  onFilterApplied,
  onFilterCleared,
  ...htmlAttributes
}: TabbedFilterContainerProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-tabbed-filter-container",
    css: tabbedFilterContainerCss,
    window: targetWindow,
  });

  return (
    <div {...htmlAttributes} className={cx(classBase, className)}>
      <TabsNext defaultValue="ad-hoc-filter">
        <TabListNext appearance="transparent">
          <TabNext value="ad-hoc-filter" key="ad-hoc-filter">
            <TabNextTrigger>AD HOC</TabNextTrigger>
          </TabNext>
          <TabNext value="saved-filters" key="saved-filters">
            <TabNextTrigger>SAVED</TabNextTrigger>
          </TabNext>
        </TabListNext>
        <TabNextPanel value="ad-hoc-filter" key="ad-hoc-filter">
          <FilterPanel
            filter={filter}
            onFilterApplied={onFilterApplied}
            onFilterCleared={onFilterCleared}
          >
            {children}
          </FilterPanel>
        </TabNextPanel>
        <TabNextPanel value="saved-filters" key="saved-filters">
          <SavedFilterPanel availableColumns={availableColumns} />
        </TabNextPanel>
      </TabsNext>
    </div>
  );
};
