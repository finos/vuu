import {
  TabBar,
  TabList,
  Tab,
  TabPanel,
  TabTrigger,
  Tabs,
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
      <Tabs defaultValue="ad-hoc-filter">
        <TabBar>
          <TabList appearance="transparent">
            <Tab value="ad-hoc-filter" key="ad-hoc-filter">
              <TabTrigger>{filterTabLabel}</TabTrigger>
            </Tab>
            <Tab value="saved-filters" key="saved-filters">
              <TabTrigger>{savedFilterLabel}</TabTrigger>
            </Tab>
          </TabList>
        </TabBar>
        <TabPanel value="ad-hoc-filter" key="ad-hoc-filter">
          <FilterPanel
            filter={filter}
            filterProviderKey={filterProviderKey}
            onFilterApplied={onFilterApplied}
            onFilterCleared={onFilterCleared}
          >
            {children}
          </FilterPanel>
        </TabPanel>
        <TabPanel value="saved-filters" key="saved-filters">
          <SavedFilterPanel
            {...SavedFilterPanelProps}
            filterProviderKey={filterProviderKey}
          />
        </TabPanel>
      </Tabs>
    </div>
  );
};
