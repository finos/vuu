import {
  ChangeEvent,
  HTMLAttributes,
  RefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import { Filter } from "@finos/vuu-filter-types";
import { Input } from "@salt-ds/core";
import { getNumericFilter } from "../filter-utils";
import { isValidNumber } from "@finos/vuu-utils";
import { FilterClauseValueEditor } from "./filterClauseTypes";

export interface NumericInputProps
  extends FilterClauseValueEditor,
    HTMLAttributes<HTMLDivElement> {
  operatorInputRef?: RefObject<HTMLInputElement>;
  onFilterChange?: (filter?: Filter) => void;
  operator: string;
  ref: RefObject<HTMLDivElement>;
}

export const NumericInput = ({
  className,
  column,
  filterClause,
  onFilterChange,
  operator,
}: NumericInputProps) => {
  const defaultValue =
    filterClause?.op !== "in" && isValidNumber(filterClause?.value)
      ? filterClause?.value
      : undefined;
  // const defaultOp = isNumericOperator(defaultFilter?.op)
  //   ? defaultFilter?.op
  //   : undefined;

  const [valueInputValue, setValueInputValue] = useState<string>(
    defaultValue?.toString() || ""
  );
  const valueInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValueInputValue("");
  }, [column]);

  return (
    <Input
      className={`${className}-valueInput`}
      // highlightOnFocus
      value={valueInputValue}
      ref={valueInputRef}
      // type="text"
      onChange={(event: ChangeEvent<HTMLInputElement>) => {
        setValueInputValue(event.target.value);
        const filter = getNumericFilter(
          column,
          operator,
          Number.parseFloat(event.target.value)
        );
        onFilterChange(filter);
      }}
    />
  );
};
