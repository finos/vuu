import { Filter } from "@finos/vuu-filter-types";
import { TypeaheadParams } from "@finos/vuu-protocol-types";
import { addFilter } from "../../filter-utils";
import "./range-filter.css";

export type IRange = {
  start?: number;
  end?: number;
};

type RangeFilterProps = {
  defaultTypeaheadParams: TypeaheadParams;
  filterValues: IRange | undefined;
  onFilterSubmit: (newValues: IRange, filter?: Filter) => void;
};

export const RangeFilter = ({
  defaultTypeaheadParams,
  filterValues,
  onFilterSubmit,
}: RangeFilterProps) => {
  const columnName = defaultTypeaheadParams[1];

  const startChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    const newRange = {
      start: isNaN(value) ? undefined : value,
      end: filterValues?.end,
    };
    const filter = getFilter(columnName, newRange);
    onFilterSubmit(newRange, filter);
  };

  const endChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    const newRange = {
      start: filterValues?.start,
      end: isNaN(value) ? undefined : value,
    };
    const filter = getFilter(columnName, newRange);
    onFilterSubmit(newRange, filter);
  };

  return (
    <div className="range-filter-container">
      <input
        className="range-input"
        name="start"
        onChange={startChangeHandler}
        value={filterValues?.start ?? ""}
        type="number"
      />
      {" to "}
      <input
        className="range-input"
        name="end"
        onChange={endChangeHandler}
        value={filterValues?.end ?? ""}
        type="number"
      />
    </div>
  );
};

const getFilter = (column: string, range: IRange) => {
  const startFilter = getStartFilter(column, range.start);
  const endFilter = getEndFilter(column, range.end);
  if (endFilter === undefined) return startFilter;
  return addFilter(startFilter, endFilter, { combineWith: "and" });
};

const getStartFilter = (column: string, value?: number): Filter | undefined =>
  value === undefined
    ? undefined
    : {
        column,
        op: ">",
        value: value - 1,
      };

const getEndFilter = (column: string, value?: number): Filter | undefined =>
  value === undefined
    ? undefined
    : {
        column,
        op: "<",
        value: value + 1,
      };
