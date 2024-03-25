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
import { TypeaheadParams, VuuTable } from "@finos/vuu-protocol-types";
import { useTypeaheadSuggestions } from "@finos/vuu-data-react";
import {
  ExpandoInput,
  MultiSelectionHandler,
  SingleSelectionHandler,
} from "@finos/vuu-ui-controls";
import { ExpandoCombobox } from "../ExpandoCombobox";
import { FilterClauseValueEditor } from "../filterClauseTypes";
import { SuggestionFetcher, TableSchemaTable } from "@finos/vuu-data-types";

const selectionKeys = ["Enter", " "];

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
      InputProps: InputPropsProp = {},
      className,
      column,
      "data-field": dataField,
      onDeselect,
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

    const handleSingleValueSelectionChange =
      useCallback<SingleSelectionHandler>(
        (_, value) => onChangeValue(value),
        [onChangeValue]
      );

    const handleMultiValueSelectionChange = useCallback<MultiSelectionHandler>(
      (_, values) => onChangeValue(values),
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
        if (operator === "starts" || operator === "ends") {
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
          InputPropsProp?.inputProps?.onKeyDown?.(evt);
        }
      },
      [InputPropsProp, onChangeValue, valueInputValue]
    );

    const InputProps = useMemo(() => {
      if (operator === "starts" || operator === "ends") {
        const { inputProps, ...restInputProps } = InputPropsProp;
        return {
          ...restInputProps,
          inputProps: {
            ...inputProps,
            onKeyDown: handleKeyDownFreeTextInput,
          },
        };
      } else {
        return InputPropsProp;
      }
    }, [InputPropsProp, handleKeyDownFreeTextInput, operator]);

    const getValueInputField = useCallback(() => {
      switch (operator) {
        case "in":
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
              allowEnterCommitsText
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
          return typeaheadValues.length > 0 ? (
            <ExpandoCombobox<string>
              InputProps={InputProps}
              allowBackspaceClearsSelection
              allowFreeText
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
          ) : null;
      }
    }, [
      InputProps,
      operator,
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
  }
);
