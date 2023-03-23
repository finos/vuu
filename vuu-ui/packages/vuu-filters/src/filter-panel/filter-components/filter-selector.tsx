import { TypeaheadParams, VuuColumnDataType } from "@finos/vuu-protocol-types";
import { IRange, RangeFilter } from "./range-filter";
import { TypeaheadFilter } from "./typeahead-filter";

type FilterComponentProps = {
  columnType: VuuColumnDataType | undefined;
  defaultTypeaheadParams: TypeaheadParams;
  filters: string[] | IRange | null;
  onFilterSubmit: (
    newQuery: string,
    selectedFilters: string[] | IRange,
    columnName: string
  ) => void;
};

export const FilterComponent = ({
  columnType,
  defaultTypeaheadParams,
  filters,
  onFilterSubmit,
}: FilterComponentProps) => {
  if (columnType) {
    const SelectedFilter = filterComponent[columnType];
    return (
      <SelectedFilter
        defaultTypeaheadParams={defaultTypeaheadParams}
        existingFilters={filters}
        onFilterSubmit={onFilterSubmit}
      />
    );
  }

  console.log("column type is undefined");
  return null;
};

const filterComponent: { [key: string]: React.FC<any> } = {
  string: TypeaheadFilter,
  char: TypeaheadFilter,
  int: RangeFilter,
  long: RangeFilter,
  double: RangeFilter,
};
