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

const selectionKeys = ["Enter", " "];

export interface TextInputProps
  extends FilterClauseValueEditor,
    HTMLAttributes<HTMLDivElement> {
  "data-field"?: string;
  ref: RefObject<HTMLDivElement>;
  operator: string;
  suggestionProvider?: () => SuggestionFetcher;
  value: string;
}

const NO_DATA_MATCH = ["No matching data"];

export const TextInput = forwardRef(function TextInput(
  {
    InputProps: InputPropsProp = {},
    className,
    column,
    "data-field": dataField,
    onDeselect,
    onInputComplete,
    operator,
    suggestionProvider = useTypeaheadSuggestions,
    table,
    value,
  }: TextInputProps,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  const [valueInputValue, setValueInputValue] = useState(value ?? "");
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
          if (suggestions.length === 0 && valueInputValue) {
            setTypeaheadValues(NO_DATA_MATCH);
          } else {
            setTypeaheadValues(suggestions);
          }
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
    if (typeaheadValues.length === 0) {
      return null;
    }
    switch (operator) {
      case "in":
        //TODO multiselect
        return (
          <ExpandoCombobox
            InputProps={InputProps}
            className={className}
            data-field={dataField}
            initialHighlightedIndex={0}
            source={typeaheadValues}
            onInputChange={handleInputChange}
            onSelectionChange={handleMultiValueSelectionChange}
            ref={forwardedRef}
            selectionStrategy="multiple"
            selectionKeys={selectionKeys}
            value={value}
          />
        );
      case "starts": {
        return (
          <ExpandoCombobox<string>
            InputProps={InputProps}
            ListProps={{
              className: "vuuIllustrationsOnly",
              disabled: true,
            }}
            allowFreeText
            className={className}
            data-field={dataField}
            initialHighlightedIndex={0}
            disableFilter={
              typeaheadValues === NO_DATA_MATCH && valueInputValue?.length > 0
            }
            source={typeaheadValues}
            onInputChange={handleInputChange}
            onSelectionChange={handleSingleValueSelectionChange}
            ref={forwardedRef}
            value={value}
          />
        );
      }

      case "ends":
        return (
          <ExpandoInput
            {...InputProps}
            className={className}
            data-field={dataField}
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
            allowBackspaceClearsSelection
            className={className}
            data-field={dataField}
            initialHighlightedIndex={0}
            source={typeaheadValues}
            title="value"
            onInputChange={handleInputChange}
            onDeselect={onDeselect}
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
    dataField,
    typeaheadValues,
    handleInputChange,
    handleMultiValueSelectionChange,
    forwardedRef,
    value,
    valueInputValue,
    onDeselect,
    handleSingleValueSelectionChange,
  ]);

  return getValueInputField();
});
