import type { FilterCombinatorOp } from "@finos/vuu-filter-types";
import { CycleStateButton } from "@finos/vuu-ui-controls";
import { KeyboardEventHandler, useCallback } from "react";

import "./FilterClauseCombinator.css";

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
