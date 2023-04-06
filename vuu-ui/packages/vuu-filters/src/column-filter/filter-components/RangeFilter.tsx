import { Filter } from "@finos/vuu-filter-types";
import { TypeaheadParams } from "@finos/vuu-protocol-types";
import { Input, ToolbarField } from "@heswell/salt-lab";
import { getRangeFilter } from "../utils";

export type IRange = {
  start?: number;
  end?: number;
};

type RangeFilterProps = {
  defaultTypeaheadParams: TypeaheadParams;
  filterValues: IRange | undefined;
  onChange: (newValues: IRange, filter?: Filter) => void;
};

export const RangeFilter = ({
  defaultTypeaheadParams,
  filterValues,
  onChange,
}: RangeFilterProps) => {
  const columnName = defaultTypeaheadParams[1];

  const startChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    const newRange = {
      start: isNaN(value) ? undefined : value,
      end: filterValues?.end,
    };
    const filter = getRangeFilter(columnName, newRange.start, newRange.end);
    onChange(newRange, filter);
  };

  const endChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    const newRange = {
      start: filterValues?.start,
      end: isNaN(value) ? undefined : value,
    };
    const filter = getRangeFilter(columnName, newRange.start, newRange.end);
    onChange(newRange, filter);
  };

  return (
    <div style={{ display: "flex", flexDirection: "row" }}>
      <ToolbarField label="From">
        <Input
          onChange={startChangeHandler}
          value={filterValues?.start?.toString() || ""}
          type="number"
        />
      </ToolbarField>
      <ToolbarField label="To">
        <Input
          onChange={endChangeHandler}
          value={filterValues?.end?.toString() || ""}
          type="number"
        />
      </ToolbarField>
    </div>
  );
};
