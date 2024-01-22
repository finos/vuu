import {
  ChangeEvent,
  forwardRef,
  ForwardedRef,
  HTMLAttributes,
  RefObject,
  useState,
  useCallback,
  KeyboardEvent,
} from "react";
import { ExpandoInput } from "@finos/vuu-ui-controls";
import { isValidNumber } from "@finos/vuu-utils";
import { FilterClauseValueEditor } from "./filterClauseTypes";

export interface NumericInputProps
  extends FilterClauseValueEditor<number>,
    HTMLAttributes<HTMLDivElement> {
  operatorInputRef?: RefObject<HTMLInputElement>;
  operator: string;
  ref: RefObject<HTMLDivElement>;
  value?: number;
}

export const NumericInput = forwardRef(function NumericInput(
  {
    InputProps,
    className,
    onInputComplete,
    value: valueProp,
  }: NumericInputProps,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  const [value, setValue] = useState<string>(
    isValidNumber(valueProp) ? valueProp.toString() : ""
  );

  // useEffect(() => {
  //   setValueInputValue("");
  // }, [column]);

  const handleChange = useCallback((evt: ChangeEvent<HTMLInputElement>) => {
    const { value } = evt.target as HTMLInputElement;

    const numericValue = parseFloat(value);
    if (isValidNumber(numericValue)) {
      console.log("its valid");
    }
    setValue(value);
  }, []);

  const handleKeyDown = useCallback(
    (evt: KeyboardEvent<HTMLInputElement>) => {
      if (evt.key === "Enter") {
        const { value } = evt.target as HTMLInputElement;
        const numericValue = parseFloat(value);
        if (isValidNumber(numericValue)) {
          onInputComplete(numericValue);
        }
      }
    },
    [onInputComplete]
  );

  return (
    <ExpandoInput
      {...InputProps}
      className={className}
      value={value}
      ref={forwardedRef}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
    />
  );
});
