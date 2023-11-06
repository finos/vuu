import {
  FormEvent,
  ForwardedRef,
  forwardRef,
  HTMLAttributes,
  KeyboardEvent,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { TypeaheadParams } from "@finos/vuu-protocol-types";
import {
  SuggestionFetcher,
  useTypeaheadSuggestions,
} from "@finos/vuu-data-react";
import {
  ExpandoInput,
  MultiSelectionHandler,
  SingleSelectionHandler,
} from "@finos/vuu-ui-controls";
import { ExpandoCombobox } from "./ExpandoCombobox";
import { FilterClauseValueEditor } from "./filterClauseTypes";

export interface TextInputProps
  extends FilterClauseValueEditor,
    HTMLAttributes<HTMLDivElement> {
  ref: RefObject<HTMLDivElement>;
  operator: string;
  suggestionProvider?: () => SuggestionFetcher;
  value: string;
}

export const TextInput = forwardRef(function TextInput(
  {
    InputProps: InputPropsProp = {},
    className,
    column,
    onInputComplete,
    operator,
    suggestionProvider = useTypeaheadSuggestions,
    table,
    value,
  }: TextInputProps,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  const [valueInputValue, setValueInputValue] = useState(value ?? "");
  // const [selectedValues, setSelectedValue] = useState(defaultValues);
  // const [typeaheadValues, setTypeaheadValues] =
  //   useState<string[]>([defaultValues]);
  const [typeaheadValues, setTypeaheadValues] = useState<string[]>([]);
  const getSuggestions = suggestionProvider();

  const handleSingleValueSelectionChange = useCallback<SingleSelectionHandler>(
    (evt, value) => onInputComplete(value),
    [onInputComplete]
  );

  const handleMultiValueSelectionChange = useCallback<MultiSelectionHandler>(
    (evt, value) => {
      if (value.length === 1) {
        onInputComplete(value[0]);
      } else if (value.length > 1) {
        onInputComplete(value);
      }
    },
    [onInputComplete]
  );

  useEffect(() => {
    // setValueInputValue("");
  }, [column]);

  useEffect(() => {
    if (table) {
      const params: TypeaheadParams = valueInputValue
        ? [table, column.name, valueInputValue]
        : [table, column.name];
      getSuggestions(params)
        .then((suggestions) => {
          setTypeaheadValues(suggestions);
        })
        .catch((err) => {
          console.error("Error getting suggestions", err);
        });
    }
  }, [table, column, valueInputValue, getSuggestions]);

  const handleInputChange = useCallback((evt: FormEvent<HTMLInputElement>) => {
    const { value } = evt.target as HTMLInputElement;
    setValueInputValue(value);
  }, []);

  const InputProps = useMemo(() => {
    if (operator === "starts" || operator === "ends") {
      const { inputProps, ...restInputProps } = InputPropsProp;
      return {
        ...restInputProps,
        inputProps: {
          ...inputProps,
          onKeyDown: (evt: KeyboardEvent<HTMLInputElement>) => {
            if (evt.key === "Enter" && valueInputValue !== "") {
              evt.stopPropagation();
              evt.preventDefault();
              onInputComplete(valueInputValue);
            } else {
              inputProps?.onKeyDown?.(evt);
            }
          },
        },
      };
    } else {
      return InputPropsProp;
    }
  }, [InputPropsProp, onInputComplete, operator, valueInputValue]);

  const getValueInputField = useCallback(() => {
    switch (operator) {
      case "in":
        //TODO multiselect
        return (
          <ExpandoCombobox
            InputProps={InputProps}
            className={className}
            initialHighlightedIndex={0}
            source={typeaheadValues}
            onInputChange={handleInputChange}
            onSelectionChange={handleMultiValueSelectionChange}
            ref={forwardedRef}
            selectionStrategy="multiple"
            value={value}
          />
        );
      case "starts":
        return (
          <ExpandoCombobox<string>
            InputProps={InputProps}
            ListProps={{
              className: "vuuIllustrationsOnly",
              disabled: true,
            }}
            allowFreeText
            className={className}
            initialHighlightedIndex={0}
            source={typeaheadValues}
            onInputChange={handleInputChange}
            onSelectionChange={handleSingleValueSelectionChange}
            ref={forwardedRef}
            value={value}
          />
        );

      case "ends":
        return (
          <ExpandoInput
            {...InputProps}
            className={className}
            value={valueInputValue}
            ref={forwardedRef}
            onChange={handleInputChange}
          />
        );

      default:
        //TODO get a ref to input and listen to changes - connect these to typeahead
        return (
          <ExpandoCombobox<string>
            InputProps={InputProps}
            className={className}
            initialHighlightedIndex={0}
            source={typeaheadValues}
            title="value"
            onInputChange={handleInputChange}
            onSelectionChange={handleSingleValueSelectionChange}
            ref={forwardedRef}
            value={value}
          />
        );
    }
  }, [
    operator,
    InputProps,
    className,
    typeaheadValues,
    handleInputChange,
    handleMultiValueSelectionChange,
    forwardedRef,
    value,
    handleSingleValueSelectionChange,
    valueInputValue,
  ]);

  return getValueInputField();
});
