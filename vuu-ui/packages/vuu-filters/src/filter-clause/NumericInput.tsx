import {
  ChangeEvent,
  HTMLAttributes,
  RefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import { Input } from "@salt-ds/core";
import { isValidNumber } from "@finos/vuu-utils";
import { FilterClauseValueEditor } from "./filterClauseTypes";

export interface NumericInputProps
  extends FilterClauseValueEditor,
    HTMLAttributes<HTMLDivElement> {
  operatorInputRef?: RefObject<HTMLInputElement>;
  onValueChange: (value: number) => void;
  operator: string;
  ref: RefObject<HTMLDivElement>;
  value?: number;
}

export const NumericInput = ({
  className,
  column,
  // filterClause,
  onValueChange,
  // operator,
  value,
}: NumericInputProps) => {
  const [valueInputValue, setValueInputValue] = useState<string>(
    isValidNumber(value) ? value.toString() : ""
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
        onValueChange(Number.parseFloat(event.target.value));
      }}
    />
  );
};
