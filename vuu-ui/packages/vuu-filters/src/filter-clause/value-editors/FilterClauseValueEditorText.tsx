import {
  FormEvent,
  ForwardedRef,
  forwardRef,
  HTMLAttributes,
  KeyboardEventHandler,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { TypeaheadParams, VuuTable } from "@finos/vuu-protocol-types";
import { useTypeaheadSuggestions } from "@finos/vuu-data-react";
import { ExpandoInput, MultiSelectionHandler } from "@finos/vuu-ui-controls";
import { ExpandoCombobox } from "../ExpandoCombobox";
import { FilterClauseValueEditor } from "../filterClauseTypes";
import type {
  SuggestionFetcher,
  TableSchemaTable,
} from "@finos/vuu-data-types";
import { Option } from "@salt-ds/core";

const getVuuTable = (schemaTable: TableSchemaTable): VuuTable => {
  if (schemaTable.session) {
    const { module, session } = schemaTable;
    return { module, table: session };
  } else {
    return schemaTable;
  }
};

export interface FilterClauseTextValueEditorProps
  extends FilterClauseValueEditor,
    HTMLAttributes<HTMLDivElement> {
  "data-field"?: string;
  ref: RefObject<HTMLDivElement>;
  operator: string;
  suggestionProvider?: () => SuggestionFetcher;
  value: string | string[];
}

const NO_DATA_MATCH = ["No matching data"];

export const FilterClauseValueEditorText = forwardRef(
  function FilterClauseTextValueEditor(
    {
      inputProps: inputPropsProp,
      className,
      column,
      onChangeValue,
      operator,
      suggestionProvider = useTypeaheadSuggestions,
      table,
      value,
    }: FilterClauseTextValueEditorProps,
    forwardedRef: ForwardedRef<HTMLDivElement>
  ) {
    const isMultiValue = operator === "in";

    // If we have a multiselect text value which we are editing, this will render
    // a comma delimited list of the selected values. That is not what we display
    // by default when using a multiselect combo. Its not a huge problem - as soon
    // as user focuses this component and we display dropdown, input text is cleared
    // (so user can type to filter list) until dropdown closes again. <ight need to
    // revisit.
    const [valueInputValue, setValueInputValue] = useState(
      value?.toString() ?? ""
    );
    const [typeaheadValues, setTypeaheadValues] = useState<string[]>([]);

    const getSuggestions = suggestionProvider();

    const handleSingleValueSelectionChange = useCallback(
      (_, [value]: string[]) => onChangeValue(value),
      [onChangeValue]
    );

    const handleMultiValueSelectionChange = useCallback<MultiSelectionHandler>(
      // TODO when will this ever be final ?
      (_, values) => onChangeValue(values, false),
      [onChangeValue]
    );

    useEffect(() => {
      if (table) {
        const vuuTable = getVuuTable(table);
        const params: TypeaheadParams =
          valueInputValue && !isMultiValue
            ? [vuuTable, column.name, valueInputValue]
            : [vuuTable, column.name];
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
    }, [table, column, valueInputValue, getSuggestions, isMultiValue]);

    const handleInputChange = useCallback(
      (evt: FormEvent<HTMLInputElement>) => {
        const { value } = evt.target as HTMLInputElement;
        console.log(`handleInputChange "${value}"`);
        setValueInputValue(value);
        // we want to set the filterclause status to valid, but not trigger focus chanmge
        if (
          operator === "starts" ||
          operator === "ends" ||
          operator === "contains"
        ) {
          onChangeValue(value, false);
        }
      },
      [onChangeValue, operator]
    );

    const handleKeyDownFreeTextInput = useCallback<
      KeyboardEventHandler<HTMLInputElement>
    >(
      (evt) => {
        console.log(`handleKeyDownFreeTextInput ${valueInputValue}`);
        if (
          (evt.key === "Enter" || evt.key === "Tab") &&
          valueInputValue !== ""
        ) {
          evt.stopPropagation();
          evt.preventDefault();
          console.log(`call onInputComplete ${valueInputValue}`);
          onChangeValue(valueInputValue);
        } else {
          inputPropsProp?.onKeyDown?.(evt);
        }
      },
      [inputPropsProp, onChangeValue, valueInputValue]
    );

    const inputProps = useMemo(() => {
      if (operator === "starts" || operator === "ends") {
        return {
          ...inputPropsProp,
          onKeyDown: handleKeyDownFreeTextInput,
        };
      } else {
        return inputPropsProp;
      }
    }, [inputPropsProp, handleKeyDownFreeTextInput, operator]);

    const getValueInputField = useCallback(() => {
      switch (operator) {
        case "in":
          return (
            <ExpandoCombobox
              inputProps={inputProps}
              className={className}
              data-field="value"
              onChange={handleInputChange}
              onSelectionChange={handleMultiValueSelectionChange}
              ref={forwardedRef}
              multiselect
              truncate
              value={value}
            >
              {typeaheadValues
                // .filter((typeaheadValue) =>
                //   typeaheadValue
                //     .toLowerCase()
                //     .includes(value.trim().toLowerCase())
                // )
                .map((state) => (
                  <Option value={state} key={state} />
                ))}
            </ExpandoCombobox>
          );
        case "starts": {
          return (
            <ExpandoCombobox
              inputProps={inputProps}
              className={className}
              data-field="value"
              onChange={handleInputChange}
              onSelectionChange={handleSingleValueSelectionChange}
              ref={forwardedRef}
              value={value}
            >
              {typeaheadValues.map((state) => (
                <Option value={state} key={state} disabled />
              ))}
            </ExpandoCombobox>
          );
        }

        case "ends":
          return (
            <ExpandoInput
              inputProps={inputProps}
              className={className}
              data-field="value"
              value={valueInputValue}
              ref={forwardedRef}
              onChange={handleInputChange}
            />
          );

        default: {
          return typeaheadValues.length > 0 ? (
            <ExpandoCombobox
              inputProps={inputProps}
              className={className}
              data-field="value"
              title="value"
              onChange={handleInputChange}
              onSelectionChange={handleSingleValueSelectionChange}
              ref={forwardedRef}
              value={value}
            >
              {typeaheadValues.map((state) => (
                <Option value={state} key={state} />
              ))}
            </ExpandoCombobox>
          ) : null;
        }
      }
    }, [
      inputProps,
      operator,
      className,
      typeaheadValues,
      handleInputChange,
      handleMultiValueSelectionChange,
      forwardedRef,
      value,
      valueInputValue,
      handleSingleValueSelectionChange,
    ]);

    return getValueInputField();
  }
);
