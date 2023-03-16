import { TypeaheadParams } from "@finos/vuu-protocol-types";
import { useEffect, useState } from "react";
import "./range-filter.css";

export const RangeFilter = (props: {
  defaultTypeaheadParams: TypeaheadParams;
  existingFilters: IRange | null;
  onFilterSubmit: Function;
}) => {
  const columnName = props.defaultTypeaheadParams[1];
  const [range, setRange] = useState<IRange>(
    props.existingFilters ?? {
      start: null,
      end: null,
    }
  );
  const [query, setQuery] = useState<string | null>(null);

  useEffect(() => {
    setQuery(getRangeQuery(range, columnName));
  }, [range]);

  useEffect(() => {
    props.onFilterSubmit(query, range, columnName);
  }, [query]);

  const inputChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === "" ? null : Number(e.target.value);

    setRange({
      ...range,
      [e.target.name]: value,
    });
  };

  return (
    <div className="range-filter-container">
      <input
        className="range-input"
        name="start"
        onChange={inputChangeHandler}
        value={(range && range.start) ?? ""}
      />
      {" to "}
      <input
        className="range-input"
        name="end"
        onChange={inputChangeHandler}
        value={(range && range.end) ?? ""}
      />
    </div>
  );
};

const getRangeQuery = (range: IRange, column: string): string => {
  let queryType = "" as keyof typeof queryOptions;

  if (range.start !== null) queryType = "start";
  if (range.end !== null) {
    if (queryType === "start") queryType = "both";
    else queryType = "end";
  }

  const queryOptions = {
    start: `${column} > ${range.start ? range.start - 1 : null}`,
    end: `${column} < ${range.end ? range.end + 1 : null}`,
    both: `${column} > ${
      range.start ? range.start - 1 : null
    } and ${column} < ${range.end ? range.end + 1 : null}`,
  };

  return queryOptions[queryType];
};

export interface IRange {
  start: number | null;
  end: number | null;
}
