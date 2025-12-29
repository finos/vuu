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
      "filter" | "filterProviderKey" | "onFilterApplied" | "onFilterCleared"
    > {
  SavedFilterPanelProps?: Pick<
    SavedFilterPanelProps,
    "availableColumns" | "filterPillPermissions"
  >;
  children: ReactNode;
  filterTabLabel?: string;
  savedFilterLabel?: string;
}

export const TabbedFilterContainer = ({
  SavedFilterPanelProps,
  children,
  className,
  filter,
  filterProviderKey,
  filterTabLabel = "Ad hoc",
  onFilterApplied,
  onFilterCleared,
  savedFilterLabel = "Saved",
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
            <TabNextTrigger>{filterTabLabel}</TabNextTrigger>
          </TabNext>
          <TabNext value="saved-filters" key="saved-filters">
            <TabNextTrigger>{savedFilterLabel}</TabNextTrigger>
          </TabNext>
        </TabListNext>
        <TabNextPanel value="ad-hoc-filter" key="ad-hoc-filter">
          <FilterPanel
            filter={filter}
            filterProviderKey={filterProviderKey}
            onFilterApplied={onFilterApplied}
            onFilterCleared={onFilterCleared}
          >
            {children}
          </FilterPanel>
        </TabNextPanel>
        <TabNextPanel value="saved-filters" key="saved-filters">
          <SavedFilterPanel
            {...SavedFilterPanelProps}
            filterProviderKey={filterProviderKey}
          />
        </TabNextPanel>
      </TabsNext>
    </div>
  );
};
