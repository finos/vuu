import {
  Filter,
  isMultiValueFilter,
  isSingleValueFilter,
} from "@finos/vuu-filters";
import { Dropdown, ToolbarField } from "@heswell/uitk-lab";
import { ReactElement } from "react";

const filterToControl = (filter: Filter): ReactElement | ReactElement[] => {
  if (isSingleValueFilter(filter)) {
    const { column, value } = filter;
    return (
      <ToolbarField
        className="vuuFilterDropdown"
        key={column}
        label={column}
        labelPlacement="top"
      >
        <Dropdown
          defaultSelected={value}
          selectionStrategy="default"
          source={[value]}
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
        <Dropdown
          defaultSelected={values}
          selectionStrategy="multiple"
          source={values}
          style={{ width: 100 }}
        />
      </ToolbarField>
    );
  } else {
    return filter.filters.map(filterToControl) as ReactElement[];
  }
};

export const useFilterToolbar = ({ filter }: { filter?: Filter }) => {
  if (filter) {
    return filterToControl(filter);
  } else {
    return [];
  }
};
