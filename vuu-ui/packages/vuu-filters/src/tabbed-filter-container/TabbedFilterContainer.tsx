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
import { FilterProvider } from "../filter-provider/FilterProvider";
import { SavedFilterPanel } from "../saved-filters/SavedFilterPanel";

import type { HTMLAttributes, ReactNode } from "react";
import {
  ColumnFilterContainer,
  FilterContainerProps,
} from "../column-filter-container/ColumnFilterContainer";

import tabbedFilterContainerCss from "./TabbedFilterContainer.css";

export interface TabbedFilterContainerProps
  extends HTMLAttributes<HTMLDivElement>,
    Pick<
      FilterContainerProps,
      "filter" | "onFilterApplied" | "onFilterCleared"
    > {
  children: ReactNode;
}

export const TabbedFilterContainer = ({
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
    <div {...htmlAttributes} className={cx("TabbedFilterContainer", className)}>
      <FilterProvider>
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
            <ColumnFilterContainer
              filter={filter}
              onFilterApplied={onFilterApplied}
              onFilterCleared={onFilterCleared}
            >
              {children}
            </ColumnFilterContainer>
          </TabNextPanel>
          <TabNextPanel value="saved-filters" key="saved-filters">
            <SavedFilterPanel />
          </TabNextPanel>
        </TabsNext>
      </FilterProvider>
    </div>
  );
};
