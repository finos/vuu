import { useCallback } from "react";
import {
  type CommitHandler,
  EpochTimestamp,
  type TemporalInfo,
} from "@vuu-ui/vuu-utils";
import type { NumericFilterClauseOp } from "@vuu-ui/vuu-filter-types";
import type { FilterClauseValueEditor } from "../filterClauseTypes";
import { VuuDatePicker } from "@vuu-ui/vuu-ui-controls";

interface FilterClauseValueEditorDateProps
  extends Pick<FilterClauseValueEditor, "onChangeValue" | "inputProps"> {
  className?: string;
  operator: NumericFilterClauseOp;
  temporalInfo: TemporalInfo;
  /**
   * epoch value in the column encoding (millis number or nanos string)
   */
  value: number | string | undefined;
}

/**
 * Date filter value editor. The value emitted is the start of the selected day
 * (in the column time zone), in the column encoding. When the filter query is
 * created, the clause is applied to the whole day e.g. '=' selects all values
 * on that day, '>' selects all values after that day (see temporalFilterAsQuery).
 */
export const FilterClauseValueEditorDate = ({
  className,
  inputProps,
  onChangeValue,
  temporalInfo,
  value,
}: FilterClauseValueEditorDateProps) => {
  const { encoding, timeZone } = temporalInfo;
  const handleCommit = useCallback<CommitHandler<HTMLElement, number>>(
    (_e, startOfDayMillis) => {
      const timestamp = EpochTimestamp.fromMillis(startOfDayMillis);
      onChangeValue(
        encoding === "epochNanos"
          ? timestamp.toWire("epochNanos")
          : timestamp.toWire("epochMillis"),
      );
    },
    [encoding, onChangeValue],
  );

  return (
    <VuuDatePicker
      data-field="value"
      inputProps={inputProps}
      className={className}
      onCommit={handleCommit}
      timeZone={timeZone}
      value={EpochTimestamp.fromWire(value, encoding)}
    />
  );
};
