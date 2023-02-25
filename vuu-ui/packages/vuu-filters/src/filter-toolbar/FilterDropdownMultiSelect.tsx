import { Dropdown, DropdownProps } from "@heswell/salt-lab";
import { useCallback, useState } from "react";
import { IFilterSuggestionProvider } from "../filter-input";

const isString = (s?: string | string[]): s is string => typeof s === "string";

const stripQuotes = <T extends string | string[]>(
  selected?: T
): T | undefined => {
  if (selected === undefined) {
    return undefined;
  } else if (isString(selected)) {
    if (selected.startsWith('"') && selected.endsWith('"')) {
      return selected.slice(1, -1) as T;
    } else {
      return selected;
    }
  } else {
    return selected.map(stripQuotes) as T;
  }
};

export interface FilterDropdownProps extends DropdownProps<string, "multiple"> {
  column: string;
  suggestionProvider: IFilterSuggestionProvider;
}

export const FilterDropdownMultiSelect = ({
  column,
  selected: selectedProp,
  suggestionProvider,
  ...props
}: FilterDropdownProps) => {
  const selected = stripQuotes(selectedProp);
  const initialValues = Array.isArray(selected)
    ? selected
    : selected != null
    ? [selected]
    : [];
  const [values, setValues] = useState<string[]>(initialValues);
  const handleOpenChange = useCallback(
    async (isOpen) => {
      if (isOpen) {
        const values = await suggestionProvider.getSuggestions("columnValue", {
          columnName: column,
        });
        console.log({ values });
        setValues(values.map((suggestion) => suggestion.label));
      }
    },
    [column, suggestionProvider]
  );

  return (
    <Dropdown<string, "multiple">
      {...props}
      onOpenChange={handleOpenChange}
      selected={selected}
      selectionStrategy="multiple"
      source={values}
    />
  );
};
