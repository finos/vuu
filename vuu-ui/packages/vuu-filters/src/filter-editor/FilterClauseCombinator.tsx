import type { FilterCombinatorOp } from "@finos/vuu-filter-types";
import { KeyboardEventHandler } from "react";
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
  onChange: _,
  onKeyDown,
  operator,
}: FilterClauseCombinatorProps) => {
  return (
    <div className={classBase} onKeyDown={onKeyDown} role="button" tabIndex={0}>
      {operator.toUpperCase()}
    </div>
  );
};
