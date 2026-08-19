import {
  TabList as TabListNext,
  Tab as TabNext,
  TabPanel as TabNextPanel,
  TabTrigger as TabNextTrigger,
  Tabs as TabsNext,
} from "@salt-ds/core";
import cx from "clsx";
import type { HTMLAttributes, ReactNode } from "react";
import type { FilterContainerProps } from "../filter-container/FilterContainer";
import { FilterPanel } from "../filter-panel/FilterPanel";
import {
  SavedFilterPanel,
  type SavedFilterPanelProps,
} from "../saved-filters/SavedFilterPanel";

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
