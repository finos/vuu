import { useCallback } from "react";
import {
  type CommitHandler,
  EpochTimestamp,
  isValidTimeString,
  type TemporalInfo,
  type TimeString,
} from "@vuu-ui/vuu-utils";
import type { NumericFilterClauseOp } from "@vuu-ui/vuu-filter-types";
import type { FilterClauseValueEditor } from "../filterClauseTypes";
import { VuuTimePicker } from "@vuu-ui/vuu-ui-controls";

interface FilterClauseValueEditorTimeProps
  extends Pick<FilterClauseValueEditor, "onChangeValue" | "inputProps"> {
  className?: string;
  operator: NumericFilterClauseOp;
  temporalInfo: TemporalInfo;
  /**
   * A TimeString (hh:mm:ss) or, for filters created by an earlier version,
   * an epoch value.
   */
  value: number | string | undefined;
}

const pad = (n: number) => `${n}`.padStart(2, "0");

const toTimeString = (
  value: number | string | undefined,
  { encoding, timeZone }: TemporalInfo,
): TimeString | undefined => {
  if (isValidTimeString(value)) {
    return value;
  }
  const timestamp = EpochTimestamp.fromWire(value, encoding);
  if (timestamp) {
    const { hour, minute, second } = timestamp.getFields(timeZone);
    return `${pad(hour)}:${pad(minute)}:${pad(second)}` as TimeString;
  }
};

/**
 * Time filter value editor. Emits a TimeString value. When the filter query
 * is created, the time is resolved against today's date (in the column time
 * zone), so a saved filter always applies to the current day.
 */
export const FilterClauseValueEditorTime = ({
  className,
  onChangeValue,
  temporalInfo,
  value,
}: FilterClauseValueEditorTimeProps) => {
  const handleCommit = useCallback<CommitHandler<HTMLInputElement, TimeString>>(
    (_e, timeString) => {
      if (isValidTimeString(timeString)) {
        onChangeValue(timeString);
      }
    },
    [onChangeValue],
  );

  return (
    <VuuTimePicker
      data-field="value"
      className={className}
      defaultValue={toTimeString(value, temporalInfo)}
      onCommit={handleCommit}
    />
  );
};
