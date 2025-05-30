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
import { ExpandoInput } from "@vuu-ui/vuu-ui-controls";
import { isValidNumber } from "@vuu-ui/vuu-utils";
import { FilterClauseValueEditor } from "../filterClauseTypes";

export interface FilterClauseNumericValueEditorProps
  extends FilterClauseValueEditor,
    HTMLAttributes<HTMLDivElement> {
  "data-field"?: string;
  operatorInputRef?: RefObject<HTMLInputElement>;
  operator: string;
  value?: number;
}

export const FilterClauseValueEditorNumber = forwardRef(
  function FilterClauseNumericValueEditor(
    {
      inputProps,
      className,
      "data-field": dataField,
      onChangeValue,
      value: valueProp,
    }: FilterClauseNumericValueEditorProps,
    forwardedRef: ForwardedRef<HTMLDivElement>,
  ) {
    const [value, setValue] = useState<string>(
      isValidNumber(valueProp) ? valueProp.toString() : "",
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
        if (evt.key === "Enter" || evt.key === "Tab") {
          const { value } = evt.target as HTMLInputElement;
          const numericValue = parseFloat(value);
          if (isValidNumber(numericValue)) {
            onChangeValue(numericValue);
          }
        }
      },
      [onChangeValue],
    );

    return (
      <ExpandoInput
        inputProps={inputProps}
        className={className}
        data-field={dataField}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        ref={forwardedRef}
        value={value}
      />
    );
  },
);
