import {
  ChangeEventHandler,
  HTMLAttributes,
  RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Filter, FilterClause } from "@finos/vuu-filter-types";
import { TypeaheadParams, VuuTable } from "@finos/vuu-protocol-types";
import { ComboBox, ComboBoxDeprecated } from "@salt-ds/lab";
import { ListChangeHandler } from "@salt-ds/lab/dist-types/list-deprecated";
import { getTypeaheadFilter } from "../column-filter/utils";
import {
  TEXT_OPERATORS,
  TextOperator,
  isString,
  isTextOperator,
} from "../operator-utils";
import { useTypeaheadSuggestions } from "@finos/vuu-data-react";

type TextInputProps = HTMLAttributes<HTMLDivElement> & {
  table: VuuTable;
  column: string;
  operatorInputRef: RefObject<HTMLInputElement>;
  onFilterChange: (filter?: Filter) => void;
  defaultFilter?: FilterClause;
};

export const TextInput = ({
  table,
  column,
  operatorInputRef,
  onFilterChange,
  defaultFilter,
  className,
}: TextInputProps) => {
  const defaultValues = (
    defaultFilter?.op === "in" ? defaultFilter.values : [defaultFilter?.value]
  ).filter(isString);
  const defaultOp = isTextOperator(defaultFilter?.op)
    ? defaultFilter?.op
    : undefined;

  const [valueInputValue, setValueInputValue] = useState("");
  const [selectedValues, setSelectedValue] = useState(defaultValues);
  const [selectedOperator, setSelectedOperator] = useState<
    TextOperator | undefined
  >(defaultOp);
  const [typeaheadValues, setTypeaheadValues] =
    useState<string[]>(defaultValues);
  const getSuggestions = useTypeaheadSuggestions();
  const valueInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelectedOperator(undefined);
    setValueInputValue("");
  }, [column]);

  useEffect(() => {
    const params: TypeaheadParams = valueInputValue
      ? [table, column, valueInputValue]
      : [table, column];
    getSuggestions(params)
      .then((suggestions) => setTypeaheadValues(suggestions))
      .catch((err) => {
        console.error("Error getting suggsetions", err);
      });
  }, [table, column, valueInputValue, getSuggestions]);

  const onValueInputChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    console.log("onValueInputChange", event.target.value);
    setValueInputValue(event.target.value);
  };

  const onMultiSelectValueChange: ListChangeHandler<string, "multiple"> =
    useCallback(
      (_event, selected) => {
        console.log("onValueChange", selected);
        setValueInputValue("");
        setSelectedValue(selected || []);
        const filter = getTypeaheadFilter(column, selected || [], false);
        onFilterChange(filter);
      },
      [column, onFilterChange]
    );

  const getValueInputField = useCallback(() => {
    switch (selectedOperator) {
      case undefined:
        return undefined;
      case TextOperator.IN:
        return (
          <ComboBoxDeprecated // The new ComboBox isn't multi-selectable
            multiSelect
            className={`${className}-valueInput`}
            source={typeaheadValues}
            onChange={onMultiSelectValueChange}
            onInputChange={onValueInputChange}
            inputValue={valueInputValue}
            inputRef={valueInputRef}
            selectedItem={selectedValues}
            InputProps={{
              inputProps: { autoComplete: "off" },
            }}
            ListProps={{
              className: `${className}-valueInput-list`,
              borderless: true,
            }}
            delimiter={","}
            allowFreeText
          />
        );
      default:
        return (
          <ComboBox<string, "deselectable">
            className={`${className}-valueInput`}
            source={typeaheadValues}
            onSelectionChange={(_event, selected) => {
              onMultiSelectValueChange(
                _event,
                selected === null ? null : [selected]
              );
            }}
            selectionStrategy="deselectable"
            InputProps={{
              highlightOnFocus: true,
              inputProps: { autoComplete: "off" },
            }}
            ref={valueInputRef}
            openOnFocus
            value={selectedValues[0]}
          />
        );
    }
  }, [
    onMultiSelectValueChange,
    selectedOperator,
    typeaheadValues,
    valueInputValue,
    selectedValues,
    className,
  ]);

  return (
    <>
      <ComboBox<TextOperator, "deselectable">
        className={`${className}-operatorSelector`}
        selectionStrategy="deselectable"
        source={TEXT_OPERATORS}
        onSelectionChange={(_event, selectedOperator) => {
          setSelectedOperator(selectedOperator || undefined);
          if (!selectedOperator) return;
          setTimeout(() => {
            valueInputRef.current?.querySelector("input")?.focus();
          }, 100);
        }}
        InputProps={{
          highlightOnFocus: true,
          inputProps: { autoComplete: "off" },
        }}
        ref={operatorInputRef}
        getFilterRegex={selectedOperator && (() => /.*/)}
      />
      {getValueInputField()}
    </>
  );
};
