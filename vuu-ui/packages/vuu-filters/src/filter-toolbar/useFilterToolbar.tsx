import {
  Filter,
  isNamedFilter,
  isMultiValueFilter,
  isSingleValueFilter,
} from "@vuu-ui/vuu-filters";
import { ToggleButton, ToolbarField } from "@heswell/uitk-lab";
import { ReactElement } from "react";
import { ISuggestionProvider, SuggestionConsumer } from "@vuu-ui/vuu-filters";
import { FilterDropdown } from "./FilterDropdown";

const filterToControl = (
  filter: Filter,
  suggestionProvider: ISuggestionProvider
): ReactElement | ReactElement[] => {
  if (isNamedFilter(filter)) {
    return (
      <ToggleButton
        className="vuuToggleButton"
        // onToggle={handleToggleTestOne}
        toggled={true}
        variant="secondary"
      >
        {filter.name}
      </ToggleButton>
    );
  } else if (isSingleValueFilter(filter)) {
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
          selected={value}
          selectionStrategy="default"
          source={[value]}
          suggestionProvider={suggestionProvider}
          style={{ width: 100 }}
        />
      </ToolbarField>
    );
  } else if (isMultiValueFilter(filter)) {
    const { column, values } = filter;
    return (
      <ToolbarField
        className="vuuFilterDropdown"
        label={column}
        key={column}
        labelPlacement="top"
      >
        <FilterDropdown
          column={column}
          selected={values}
          selectionStrategy="multiple"
          source={values}
          suggestionProvider={suggestionProvider}
          style={{ width: 100 }}
        />
      </ToolbarField>
    );
  } else {
    return filter.filters.map((filter) =>
      filterToControl(filter, suggestionProvider)
    ) as ReactElement[];
  }
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
  } else {
    return [];
  }
};
