import { TypeaheadParams } from "@finos/vuu-protocol-types";
import { useEffect, useState } from "react";
import "./range-filter.css";

export const RangeFilter = ({
  filterParams,
  existingFilters,
  onFilterSubmit,
}: Props) => {
  const filterColumn = filterParams[1];
  const [range, setRange] = useState<IRange | null>(existingFilters ?? null);
  const [query, setQuery] = useState<string | null>(null);

  useEffect(() => {
    setQuery(buildRangeQuery(range, filterColumn));
  }, [range]);

  useEffect(() => {
    onFilterSubmit(query, range, filterColumn);
  }, [query]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === "" ? null : Number(e.target.value);

    setRange((prevRange) => ({
      ...prevRange,
      [e.target.name]: value,
    }));
  };

  return (
    <div className="range-filter-container">
      <input
        className="range-input"
        name="start"
        onChange={handleInputChange}
        value={range?.start ?? ""}
      />
      {" to "}
      <input
        className="range-input"
        name="end"
        onChange={handleInputChange}
        value={(range && range.end) ?? ""}
      />
    </div>
  );
};

const buildRangeQuery = (range: IRange | null, column: string): string => {
  if (!range) {
    return "";
  }

  const { start, end } = range;

  if (start === null && end === null) {
    return "";
  }

  const startQuery = start && `${column} > ${start - 1}`;
  const endQuery = end && `${column} < ${end + 1}`;

  return [startQuery, endQuery].filter(Boolean).join(" and ");
};

export interface IRange {
  start?: number | null;
  end?: number | null;
}

interface Props {
  filterParams: TypeaheadParams;
  existingFilters: IRange | null;
  onFilterSubmit: (
    query: string | null,
    range: IRange | null,
    filterColumn: string
  ) => void;
}
