import { ExpandoInput } from "@vuu-ui/vuu-ui-controls";
import { CommitHandler, isValidNumber } from "@vuu-ui/vuu-utils";
import {
  ChangeEvent,
  ForwardedRef,
  forwardRef,
  HTMLAttributes,
  KeyboardEvent,
  useCallback,
  useState,
} from "react";
import { FilterClauseValueEditor } from "../filterClauseTypes";
import {
  formatNumericShorthand,
  getNumericValueError,
  getNumericValueHint,
  parseNumericValue,
} from "./numeric-value-utils";

export interface FilterClauseNumericValueEditorProps
  extends FilterClauseValueEditor,
    HTMLAttributes<HTMLDivElement> {
  "data-field"?: string;
  operator: string;
  value?: number;
}

export const FilterClauseValueEditorNumber = forwardRef(
  function FilterClauseNumericValueEditor(
    {
      column,
      inputProps,
      className,
      "data-field": dataField,
      onChangeValue,
      value: valueProp,
    }: FilterClauseNumericValueEditorProps,
    forwardedRef: ForwardedRef<HTMLDivElement>,
  ) {
    const integerOnly =
      column.serverDataType === "int" || column.serverDataType === "long";
    const [value, setValue] = useState<string>(
      isValidNumber(valueProp) ? formatNumericShorthand(valueProp) : "",
    );
    const errorMessage = getNumericValueError(value, integerOnly);
    const hint = getNumericValueHint(value, integerOnly);

    // A valid number makes the clause valid as soon as it is typed, so Save
    // is enabled. It is committed on Enter, Tab or blur.
    const handleChange = useCallback(
      (evt: ChangeEvent<HTMLInputElement>) => {
        const { value } = evt.target;
        setValue(value);
        onChangeValue(parseNumericValue(value, integerOnly), false);
      },
      [integerOnly, onChangeValue],
    );

    const commitValue = useCallback(
      (text: string) => {
        const numericValue = parseNumericValue(text, integerOnly);
        if (numericValue !== undefined) {
          setValue(formatNumericShorthand(numericValue));
          onChangeValue(numericValue);
        }
      },
      [integerOnly, onChangeValue],
    );

    const handleCommit = useCallback<CommitHandler>(
      (_, value) => {
        if (typeof value === "string") {
          commitValue(value);
        }
      },
      [commitValue],
    );

    const handleKeyDown = useCallback(
      (evt: KeyboardEvent<HTMLInputElement>) => {
        if (evt.key === "Tab") {
          commitValue((evt.target as HTMLInputElement).value);
        }
      },
      [commitValue],
    );

    return (
      <ExpandoInput
        inputProps={{ ...inputProps, title: hint }}
        className={className}
        data-field={dataField}
        errorMessage={errorMessage}
        onChange={handleChange}
        onCommit={handleCommit}
        onKeyDown={handleKeyDown}
        ref={forwardedRef}
        value={value}
      />
    );
  },
);
