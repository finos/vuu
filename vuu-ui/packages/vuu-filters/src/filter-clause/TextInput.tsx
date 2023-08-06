import {
  ChangeEventHandler,
  ForwardedRef,
  forwardRef,
  HTMLAttributes,
  RefObject,
  SyntheticEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { TypeaheadParams } from "@finos/vuu-protocol-types";
import { ComboBoxDeprecated } from "@salt-ds/lab";
import { ListChangeHandler } from "@salt-ds/lab/dist-types/list-deprecated";
import { getTypeaheadFilter } from "../column-filter/utils";
import { useTypeaheadSuggestions } from "@finos/vuu-data-react";
import { ExpandoCombobox } from "./ExpandoCombobox";
import { FilterClauseValueEditor } from "./filterClauseTypes";

export interface TextInputProps
  extends FilterClauseValueEditor,
    HTMLAttributes<HTMLDivElement> {
  ref: RefObject<HTMLDivElement>;
  operator: string;
  onValueChange: (value: string) => void;
  value: string;
}

export const TextInput = forwardRef(function TextInput(
  {
    className,
    column,
    filterClause,
    onValueChange,
    operator,
    table,
    value,
  }: TextInputProps,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  const [valueInputValue, setValueInputValue] = useState(value ?? "");
  // const [selectedValues, setSelectedValue] = useState(defaultValues);
  const [selectedValues, setSelectedValue] = useState<string[]>([]);
  // const [typeaheadValues, setTypeaheadValues] =
  //   useState<string[]>([defaultValues]);
  const [typeaheadValues, setTypeaheadValues] = useState<string[]>([]);
  const getSuggestions = useTypeaheadSuggestions();
  const valueInputRef = useRef<HTMLInputElement>(null);

  const handleValueSelectionChange = useCallback(
    (evt: SyntheticEvent, value: string | null) => {
      console.log(`selected value ${value}`);
      // setOperator(operator ?? undefined);
      onValueChange(value ?? "");
    },
    [onValueChange]
  );

  useEffect(() => {
    // setValueInputValue("");
  }, [column]);

  useEffect(() => {
    if (table) {
      const params: TypeaheadParams = valueInputValue
        ? [table, column.name, valueInputValue]
        : [table, column.name];
      console.log(`getTYpeahead suggestions`);
      getSuggestions(params)
        .then((suggestions) => {
          console.log(`suggestions `, {
            suggestions,
          });
          setTypeaheadValues(suggestions);
        })
        .catch((err) => {
          console.error("Error getting suggsetions", err);
        });
    }
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
        const filter = getTypeaheadFilter(column.name, selected || [], false);
        // onFilterChange(filter);
      },
      [column]
    );

  const getValueInputField = useCallback(() => {
    switch (operator) {
      case "in":
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
          <ExpandoCombobox<string>
            source={typeaheadValues}
            onSelectionChange={handleValueSelectionChange}
            ref={forwardedRef}
            value={valueInputValue}
          />
        );
    }
  }, [
    operator,
    className,
    typeaheadValues,
    onMultiSelectValueChange,
    valueInputValue,
    selectedValues,
    handleValueSelectionChange,
    forwardedRef,
  ]);

  return getValueInputField();
});
