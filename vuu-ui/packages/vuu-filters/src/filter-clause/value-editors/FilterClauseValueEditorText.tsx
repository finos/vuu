import { useTypeaheadSuggestions } from "@vuu-ui/vuu-data-react";
import type { TypeaheadParams } from "@vuu-ui/vuu-protocol-types";
import { ExpandoInput, MultiSelectionHandler } from "@vuu-ui/vuu-ui-controls";
import { CommitHandler, getVuuTable, NO_DATA_MATCH } from "@vuu-ui/vuu-utils";
import { Option } from "@salt-ds/core";
import {
  FormEvent,
  ForwardedRef,
  forwardRef,
  HTMLAttributes,
  KeyboardEventHandler,
  SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ExpandoCombobox } from "../ExpandoCombobox";
import { FilterClauseValueEditor } from "../filterClauseTypes";

export interface FilterClauseTextValueEditorProps
  extends FilterClauseValueEditor,
    HTMLAttributes<HTMLDivElement> {
  "data-field"?: string;
  // ref: RefObject<HTMLDivElement>;
  operator: string;
  value: string | string[];
  dropdownOnAutofocus?: boolean;
}

export const FilterClauseValueEditorText = forwardRef(
  function FilterClauseTextValueEditor(
    {
      inputProps: inputPropsProp,
      className,
      column,
      onChangeValue,
      onOpenChange,
      operator,
      table,
      value,
      dropdownOnAutofocus = true,
    }: FilterClauseTextValueEditorProps,
    forwardedRef: ForwardedRef<HTMLDivElement>,
  ) {
    const isMultiValue = operator === "in";
    console.info(dropdownOnAutofocus);

    // If we have a multiselect text value which we are editing, this will render
    // a comma delimited list of the selected values. That is not what we display
    // by default when using a multiselect combo. Its not a huge problem - as soon
    // as user focuses this component and we display dropdown, input text is cleared
    // (so user can type to filter list) until dropdown closes again. <ight need to
    // revisit.
    const [valueInputValue, setValueInputValue] = useState(
      value?.toString() ?? "",
    );
    const [typeaheadValues, setTypeaheadValues] = useState<string[] | false>(
      [],
    );

    const getSuggestions = useTypeaheadSuggestions();

    const handleSingleValueSelectionChange = useCallback(
      (_: SyntheticEvent, [value]: string[]) => onChangeValue(value),
      [onChangeValue],
    );

    const handleMultiValueSelectionChange = useCallback<MultiSelectionHandler>(
      // TODO when will this ever be final ?
      (_, values) => onChangeValue(values, false),
      [onChangeValue],
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
            if (suggestions === false) {
              setTypeaheadValues(false);
            } else if (suggestions.length === 0 && valueInputValue) {
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
        setValueInputValue(value);
        // we want to set the filterclause status to valid, but not trigger focus change
        if (
          operator === "starts" ||
          operator === "ends" ||
          operator === "contains"
        ) {
          onChangeValue(value, false);
        }
      },
      [onChangeValue, operator],
    );

    const handleInputCommit = useCallback<CommitHandler>(
      (_, value = "") => {
        if (typeof value === "string") {
          onChangeValue(value);
        }
      },
      [onChangeValue],
    );

    const handleKeyDownFreeTextInput = useCallback<
      KeyboardEventHandler<HTMLInputElement>
    >(
      (evt) => {
        if (
          (evt.key === "Enter" || evt.key === "Tab") &&
          valueInputValue !== ""
        ) {
          evt.stopPropagation();
          evt.preventDefault();
          onChangeValue(valueInputValue);
        } else {
          inputPropsProp?.onKeyDown?.(evt);
        }
      },
      [inputPropsProp, onChangeValue, valueInputValue],
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
      if (typeaheadValues === false) {
        // No typeahead service available
        return (
          <ExpandoInput
            inputProps={inputProps}
            className={className}
            data-field="value"
            value={valueInputValue}
            ref={forwardedRef}
            onChange={handleInputChange}
            onCommit={handleInputCommit}
          />
        );
      }
      switch (operator) {
        case "in":
          return (
            <ExpandoCombobox
              inputProps={inputProps}
              className={className}
              data-field="value"
              onChange={handleInputChange}
              onOpenChange={onOpenChange}
              onSelectionChange={handleMultiValueSelectionChange}
              ref={forwardedRef}
              multiselect
              truncate
              value={value}
              dropdownOnAutofocus={dropdownOnAutofocus}
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
              dropdownOnAutofocus={dropdownOnAutofocus}
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
              dropdownOnAutofocus={dropdownOnAutofocus}
            >
              {typeaheadValues.map((state) => (
                <Option value={state} key={state} />
              ))}
            </ExpandoCombobox>
          ) : null;
        }
      }
    }, [
      typeaheadValues,
      operator,
      inputProps,
      className,
      valueInputValue,
      forwardedRef,
      handleInputChange,
      handleInputCommit,
      handleMultiValueSelectionChange,
      value,
      handleSingleValueSelectionChange,
      onOpenChange,
      dropdownOnAutofocus,
    ]);

    return getValueInputField();
  },
);
