import { TypeaheadParams, VuuColumnDataType } from "@finos/vuu-protocol-types";
import { IRange, RangeFilter } from "./range-filter";
import { TypeaheadFilter } from "./typeahead-filter";

export const FilterComponent = (props: {
  columnType: VuuColumnDataType | undefined;
  defaultTypeaheadParams: TypeaheadParams;
  filters: string[] | IRange | null;
  onFilterSubmit: Function;
}) => {
  if (props.columnType !== undefined) {
    const SelectedFilter = filterComponent[props.columnType];

    return (
      <SelectedFilter
        defaultTypeaheadParams={props.defaultTypeaheadParams}
        existingFilters={props.filters}
        onFilterSubmit={props.onFilterSubmit}
      />
    );
  }

  return null;
};

const filterComponent: { [key: string]: React.FC<any> } = {
  string: TypeaheadFilter,
  char: TypeaheadFilter,
  int: RangeFilter,
  long: RangeFilter,
  double: RangeFilter,
};
