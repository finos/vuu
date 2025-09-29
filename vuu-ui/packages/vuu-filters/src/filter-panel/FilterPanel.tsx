import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { ForwardedRef, forwardRef, HTMLAttributes } from "react";

import filterPanelCss from "./FilterPanel.css";
import {
  ColumnFilterContainer,
  ColumnFilterContainerProps,
} from "../column-filter-container/ColumnFilterContainer";
import { Button } from "@salt-ds/core";
import { useFilterPanel } from "./useFilterPanel";

const classBase = "vuuFilterPanel";

export interface FilterPanelProps
  extends HTMLAttributes<HTMLDivElement>,
    Pick<
      ColumnFilterContainerProps,
      "filter" | "onFilterApplied" | "onFilterCleared"
    > {}

export const FilterPanel = forwardRef(function FilterDisplay(
  {
    children,
    className,
    filter: filterProp,
    onFilterApplied: onFilterAppliedProp,
    onFilterCleared: onFilterClearedProp,
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
      <ColumnFilterContainer
        filter={filter}
        onFilterApplied={onFilterApplied}
        onFilterCleared={onFilterCleared}
      >
        {children}
      </ColumnFilterContainer>
      <div className={`${classBase}-toolbar`}>
        <Button disabled={disableClear} onClick={clearFilter}>
          Clear
        </Button>
        <Button disabled={disableSave} onClick={saveFilter}>
          Save
        </Button>
      </div>
      {saveFilterPrompt}
    </div>
  );
});
