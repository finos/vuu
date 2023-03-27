import { TypeaheadParams } from "@finos/vuu-protocol-types";
import "./range-filter.css";

export type IRange = {
  start?: number;
  end?: number;
};

type RangeFilterProps = {
  defaultTypeaheadParams: TypeaheadParams;
  filterValues: IRange | undefined;
  onFilterSubmit: (newFilter: IRange, query: string) => void;
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
    const query = getRangeQuery(columnName, newRange);
    onFilterSubmit(newRange, query);
  };

  const endChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    const newRange = {
      start: filterValues?.start,
      end: isNaN(value) ? undefined : value,
    };
    const query = getRangeQuery(columnName, newRange);
    onFilterSubmit(newRange, query);
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

const getRangeQuery = (column: string, range: IRange) => {
  const startQuery =
    range.start === undefined ? undefined : `${column} > ${range.start - 1}`;
  const endQuery =
    range.end === undefined ? undefined : `${column} < ${range.end + 1}`;

  return [startQuery, endQuery].filter((x) => x !== undefined).join(" and ");
};
