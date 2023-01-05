import {
  Filter, isMultiValueFilter, isNamedFilter, isSingleValueFilter, ISuggestionProvider2, SuggestionConsumer2
} from "@finos/vuu-filters";
import { ToggleButton, ToolbarField } from "@heswell/salt-lab";
import { ReactElement } from "react";
import { FilterDropdown } from "./FilterDropdown";

const filterToControl = (
  filter: Filter,
  suggestionProvider: ISuggestionProvider2
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
    const { column, values } = filter;
    return (
      <ToolbarField
        className="vuuFilterDropdown"
        label={column}
        key={column}
        labelPlacement="top"
      >
        { values.map((value, idx) => <FilterDropdown
          key={`filter-dropdown-${idx}`}
          column={column}
          selected={value.toString()}
          suggestionProvider={suggestionProvider}
          style={{ width: 100 }}
        />)}
        
      </ToolbarField>
    );
  }
  return filter.filters.map((filter) =>
    filterToControl(filter, suggestionProvider)
  ) as ReactElement[];
};

export interface FilterToolbarProps extends SuggestionConsumer2 {
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