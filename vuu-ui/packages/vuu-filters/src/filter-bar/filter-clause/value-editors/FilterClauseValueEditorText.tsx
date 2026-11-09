import type { TypeaheadParams } from "@vuu-ui/vuu-protocol-types";
import { ExpandoInput, MultiSelectionHandler } from "@vuu-ui/vuu-ui-controls";
import {
  CommitHandler,
  dispatchKeyboardEvent,
  getVuuTable,
  NO_DATA_MATCH,
  useTypeaheadSuggestions,
} from "@vuu-ui/vuu-utils";
import { Option, useForkRef } from "@salt-ds/core";
import {
  ForwardedRef,
  forwardRef,
  HTMLAttributes,
  KeyboardEventHandler,
  SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { ExpandoCombobox } from "../../../expando-combobox/ExpandoCombobox";
import { getOptionList } from "../../../expando-combobox/option-list-utils";
import { FilterClauseValueEditor } from "../filterClauseTypes";

const TYPEAHEAD_DEBOUNCE_MS = 150;

export interface FilterClauseTextValueEditorProps
  extends FilterClauseValueEditor,
    HTMLAttributes<HTMLDivElement> {
  "data-field"?: string;
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

    const expandoRef = useRef<HTMLDivElement>(null);
    const combinedRef = useForkRef(forwardedRef, expandoRef);

    // If we have a multiselect text value which we are editing, this will render
    // a comma delimited list of the selected values. That is not what we display
    // by default when using a multiselect combo. Its not a huge problem - as soon
    // as user focuses this component and we display dropdown, input text is cleared
    // (so user can type to filter list) until dropdown closes again. <ight need to
    // revisit.
    const [valueInputValue, setValueInputValue] = useState(
      value?.toString() ?? "",
    );
    // Suggestions are filtered by what the user has typed. When an existing
    // value is edited, all values are suggested until the user types.
    const [typedText, setTypedText] = useState("");
    // undefined until the first response from the typeahead service is
    // received, false if there is no typeahead service.
    const [typeaheadValues, setTypeaheadValues] = useState<
      string[] | false | undefined
    >(table ? undefined : false);

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

    const highlightFirstOption = useCallback(() => {
      if (expandoRef.current) {
        const input = expandoRef.current?.querySelector<HTMLInputElement>(
          'input[role="combobox"]',
        );
        if (input) {
          requestAnimationFrame(() => {
            // The combobox may already have made the first option (the
            // current value) active, ArrowDown would then move past it.
            const listId = input.getAttribute("aria-controls");
            const firstOption = listId
              ? input.ownerDocument
                  .getElementById(listId)
                  ?.querySelector('[role="option"]')
              : null;
            const firstOptionIsActive =
              firstOption?.classList.contains("saltOption-active") ?? false;
            dispatchKeyboardEvent(
              input,
              "keydown",
              firstOptionIsActive ? "ArrowUp" : "ArrowDown",
            );
          });
        }
      }
    }, []);

    const handleOpenChange = useCallback(
      (open: boolean, reason?: "focus" | "input" | "manual") => {
        if (open && reason === "focus" && expandoRef.current) {
          highlightFirstOption();
        }
      },
      [highlightFirstOption],
    );

    const filterText = isMultiValue ? "" : typedText;
    useEffect(() => {
      if (table === undefined) {
        setTypeaheadValues(false);
        return;
      }
      let cancelled = false;
      const vuuTable = getVuuTable(table);
      const params: TypeaheadParams = filterText
        ? [vuuTable, column.name, filterText]
        : [vuuTable, column.name];
      // requests are debounced while user is typing
      const timeoutHandle = setTimeout(
        () => {
          getSuggestions(params)
            .then((suggestions) => {
              // ignore responses to requests that have been superseded
              if (cancelled) {
                return;
              } else if (suggestions === false) {
                setTypeaheadValues(false);
              } else if (suggestions.length === 0 && filterText) {
                setTypeaheadValues(NO_DATA_MATCH);
              } else {
                setTypeaheadValues(suggestions);
              }
            })
            .catch((err) => {
              console.error("Error getting suggestions", err);
            });
        },
        filterText ? TYPEAHEAD_DEBOUNCE_MS : 0,
      );
      return () => {
        cancelled = true;
        clearTimeout(timeoutHandle);
      };
    }, [table, column, filterText, getSuggestions]);

    const handleInputChange = useCallback(
      (evt: ChangeEvent<HTMLInputElement>) => {
        const { value } = evt.target as HTMLInputElement;
        setValueInputValue(value);
        setTypedText(value);
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
          if (isMultiValue) {
            // free text entry of multiple values, comma separated
            const values = value
              .split(",")
              .map((v) => v.trim())
              .filter((v) => v !== "");
            onChangeValue(values.length > 0 ? values : undefined);
          } else {
            onChangeValue(value);
          }
        }
      },
      [isMultiValue, onChangeValue],
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
      if (typeaheadValues === undefined) {
        // Rendered once the first suggestions are received, so the first
        // option can be highlighted when the dropdown opens.
        return null;
      }
      // suggestions are already filtered by the typed text
      const suggestions = getOptionList(
        typeaheadValues || [],
        (suggestion) => suggestion,
        "",
        typedText === "" && typeof value === "string" ? value : undefined,
      );
      if (
        typeaheadValues === false ||
        (suggestions.length === 0 && operator !== "in")
      ) {
        // No typeahead service available, or no values to suggest
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
              {suggestions.map((state) => (
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
              dropdownOnAutofocus={dropdownOnAutofocus}
              onChange={handleInputChange}
              onSelectionChange={handleSingleValueSelectionChange}
              ref={forwardedRef}
              value={value}
            >
              {suggestions.map((state) => (
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
          return (
            <ExpandoCombobox
              className={className}
              data-field="value"
              dropdownOnAutofocus={dropdownOnAutofocus}
              inputProps={inputProps}
              onChange={handleInputChange}
              onOpenChange={handleOpenChange}
              onSelectionChange={handleSingleValueSelectionChange}
              ref={combinedRef}
              value={value}
            >
              {suggestions.map((state) => (
                <Option value={state} key={state} />
              ))}
            </ExpandoCombobox>
          );
        }
      }
    }, [
      typeaheadValues,
      typedText,
      operator,
      inputProps,
      className,
      valueInputValue,
      forwardedRef,
      handleInputChange,
      handleInputCommit,
      onOpenChange,
      handleMultiValueSelectionChange,
      value,
      dropdownOnAutofocus,
      handleSingleValueSelectionChange,
      handleOpenChange,
      combinedRef,
    ]);

    return getValueInputField();
  },
);
