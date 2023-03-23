import { Filter } from "@finos/vuu-filter-types";
import {
  isMultiValueFilter,
  isNamedFilter,
  isSingleValueFilter,
  IFilterSuggestionProvider,
  SuggestionConsumer,
} from "@finos/vuu-filters";
import { ToggleButton, ToolbarField } from "@heswell/salt-lab";
import { ReactElement } from "react";
import { FilterDropdown } from "./FilterDropdown";
import { FilterDropdownMultiSelect } from "./FilterDropdownMultiSelect";

const filterToControl = (
  filter: Filter,
  suggestionProvider: IFilterSuggestionProvider
): ReactElement | ReactElement[] => {
  if (isNamedFilter(filter)) {
    return (
      <ToggleButton
        className="vuuToggleButton"
        toggled={true}
        variant="secondary"
      >
        {filter.name}
      </ToggleButton>
    );
  }
  if (isSingleValueFilter(filter)) {
    const { column, value } = filter;
    return (
      <ToolbarField
        className="vuuFilterDropdown"
        key={column}
        label={column}
        labelPlacement="top"
      >
        <FilterDropdown
          column={column}
          selected={value.toString()}
          selectionStrategy="default"
          source={[value.toString()]}
          suggestionProvider={suggestionProvider}
          style={{ width: 100 }}
        />
      </ToolbarField>
    );
  }
  if (isMultiValueFilter(filter)) {
    const values = filter.values.map((v) => v.toString());
    return (
      <ToolbarField
        className="vuuFilterDropdown"
        label={filter.column}
        key={filter.column}
        labelPlacement="top"
      >
        <FilterDropdownMultiSelect
          column={filter.column}
          selected={values}
          source={values}
          suggestionProvider={suggestionProvider}
          style={{ width: 100 }}
        />
      </ToolbarField>
    );
  }
  return filter.filters.map((filter) =>
    filterToControl(filter, suggestionProvider)
  ) as ReactElement[];
};

export interface FilterToolbarProps extends SuggestionConsumer {
  filter?: Filter;
}

export const useFilterToolbar = ({
  filter,
  suggestionProvider,
}: FilterToolbarProps) => {
  if (filter) {
    return filterToControl(filter, suggestionProvider);
  }
  return [];
};
