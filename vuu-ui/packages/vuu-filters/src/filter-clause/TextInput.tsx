import {
  ChangeEventHandler,
  RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Filter, FilterClause } from "@finos/vuu-filter-types";
import { TypeaheadParams, VuuTable } from "@finos/vuu-protocol-types";
import { ComboBox, ComboBoxDeprecated } from "@heswell/salt-lab";
import { ListChangeHandler } from "@heswell/salt-lab/dist-types/list-deprecated";
import { getTypeaheadFilter } from "../column-filter/utils";
import {
  TEXT_OPERATORS,
  TextOperator,
  isString,
  isTextOperator,
} from "./operator-utils";
import { useTypeaheadSuggestions } from "@finos/vuu-data-react";

type TextInputProps = {
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
}: TextInputProps) => {
  const defaultValues = (
    defaultFilter?.op === "in" ? defaultFilter.values : [defaultFilter?.value]
  ).filter(isString);
  const defaultOp = isTextOperator(defaultFilter?.op)
    ? defaultFilter?.op
    : undefined;

  const [valueInputValue, setValueInputValue] = useState("");
  const [operatorInputValue, setOperatorInputValue] = useState("");
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
            style={{ backgroundColor: "purple" }}
            source={typeaheadValues}
            onChange={onMultiSelectValueChange}
            onInputChange={onValueInputChange}
            inputValue={valueInputValue}
            inputRef={valueInputRef}
            selectedItem={selectedValues}
            allowFreeText
          />
        );
      default:
        return (
          <ComboBox<string, "deselectable">
            style={{ backgroundColor: "blue" }}
            source={typeaheadValues}
            onSelectionChange={(_event, selected) => {
              onMultiSelectValueChange(
                _event,
                selected === null ? null : [selected]
              );
            }}
            selectionStrategy="deselectable"
            InputProps={{
              onChange: onValueInputChange,
              value: valueInputValue,
              highlightOnFocus: true,
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
  ]);

  return (
    <>
      <ComboBox<TextOperator, "deselectable">
        style={{ backgroundColor: "yellow" }}
        selectionStrategy="deselectable"
        source={TEXT_OPERATORS}
        onSelectionChange={(_event, selectedOperator) => {
          setSelectedOperator(selectedOperator || undefined);
          setTimeout(() => {
            valueInputRef.current?.querySelector("input")?.focus();
          }, 100);
        }}
        InputProps={{
          onChange: (event) => setOperatorInputValue(event.target.value),
          value: operatorInputValue,
          highlightOnFocus: true,
        }}
        ref={operatorInputRef}
        value={selectedOperator}
      />
      {getValueInputField()}
    </>
  );
};
