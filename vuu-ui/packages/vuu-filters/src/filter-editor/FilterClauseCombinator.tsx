import type { FilterCombinatorOp } from "@finos/vuu-filter-types";
import { CycleStateButton } from "@finos/vuu-ui-controls";
import { KeyboardEventHandler, useCallback } from "react";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";

import filterClauseCombinatorCss from "./FilterClauseCombinator.css";

const classBase = "vuuFilterClauseCombinator";

export type FilterClauseCombinatorChangeHandler = (
  op: FilterCombinatorOp
) => void;

export interface FilterClauseCombinatorProps {
  onChange: FilterClauseCombinatorChangeHandler;
  onKeyDown: KeyboardEventHandler;
  operator: FilterCombinatorOp;
}

export const FilterClauseCombinator = ({
  onChange,
  onKeyDown,
  operator,
}: FilterClauseCombinatorProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-filterclause-combinator",
    css: filterClauseCombinatorCss,
    window: targetWindow,
  });

  const handleChange = useCallback(
    (value) => {
      onChange(value as FilterCombinatorOp);
    },
    [onChange]
  );

  return (
    <CycleStateButton
      className={classBase}
      onChange={handleChange}
      onKeyDown={onKeyDown}
      value={operator}
      values={["and", "or"]}
      variant="primary"
    />
  );
};
