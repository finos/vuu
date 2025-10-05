import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { ForwardedRef, forwardRef, HTMLAttributes } from "react";

import filterPanelCss from "./FilterPanel.css";
import {
  FilterContainer,
  FilterContainerProps,
} from "../filter-container/FilterContainer";
import { Button } from "@salt-ds/core";
import { useFilterPanel } from "./useFilterPanel";

const classBase = "vuuFilterPanel";

export type FilterPanelPermissions = {
  allowSaveFilter: boolean;
};

export interface FilterPanelProps
  extends HTMLAttributes<HTMLDivElement>,
    Pick<
      FilterContainerProps,
      "filter" | "onFilterApplied" | "onFilterCleared"
    > {
  permissions?: FilterPanelPermissions;
}

export const FilterPanel = forwardRef(function FilterDisplay(
  {
    children,
    className,
    filter: filterProp,
    onFilterApplied: onFilterAppliedProp,
    onFilterCleared: onFilterClearedProp,
    permissions,
    ...htmlAttributes
  }: FilterPanelProps,
  forwardedRef: ForwardedRef<HTMLDivElement>,
) {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-filter-panel",
    css: filterPanelCss,
    window: targetWindow,
  });

  const {
    clearFilter,
    disableClear,
    disableSave,
    filter,
    onFilterApplied,
    onFilterCleared,
    saveFilter,
    saveFilterPrompt,
  } = useFilterPanel({
    filter: filterProp,
    onFilterApplied: onFilterAppliedProp,
    onFilterCleared: onFilterClearedProp,
  });

  return (
    <div
      {...htmlAttributes}
      className={cx(classBase, className)}
      ref={forwardedRef}
    >
      <FilterContainer
        filter={filter}
        onFilterApplied={onFilterApplied}
        onFilterCleared={onFilterCleared}
      >
        {children}
      </FilterContainer>
      <div className={`${classBase}-toolbar`}>
        <Button disabled={disableClear} onClick={clearFilter}>
          Clear
        </Button>
        {permissions?.allowSaveFilter !== false ? (
          <Button disabled={disableSave} onClick={saveFilter}>
            Save
          </Button>
        ) : null}
      </div>
      {saveFilterPrompt}
    </div>
  );
});
