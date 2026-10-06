import type { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import type { TableCellRendererProps } from "@vuu-ui/vuu-table-types";
import {
  DataValidationError,
  EpochTimestamp,
  formatTemporalInput,
  getTemporalInfo,
  getTypedTemporalValue,
  registerComponent,
  temporalInputPlaceholder,
} from "@vuu-ui/vuu-utils";
import { useCallback, useMemo } from "react";
import { InputCell } from "../input-cell";

const classBase = "vuuTableTemporalInputCell";

/**
 * An editable cell for temporal values (see getTemporalInfo). The value is
 * presented for editing in a canonical, locale independent format
 * (yyyy-mm-dd hh:mm:ss[.fffffffff]) in the column time zone. Sub-millisecond
 * precision of nano timestamp values is preserved. Edited values are returned
 * in the column encoding, i.e epoch millis (number) or epoch nanos (string).
 * Raw epoch values are also accepted as input. For 'time' columns, only the
 * time of day is edited, the date is preserved.
 */
export const TemporalInputCell = (props: TableCellRendererProps) => {
  const { column, dataRow } = props;
  const temporalInfo = useMemo(() => getTemporalInfo(column), [column]);
  const value = dataRow[column.name];

  const baseValue = useMemo(
    () =>
      temporalInfo
        ? EpochTimestamp.fromWire(value, temporalInfo.encoding)
        : undefined,
    [temporalInfo, value],
  );

  const formatValue = useCallback(
    (value?: VuuRowDataItemType) =>
      temporalInfo
        ? formatTemporalInput(
            EpochTimestamp.fromWire(value, temporalInfo.encoding),
            temporalInfo,
          )
        : `${value ?? ""}`,
    [temporalInfo],
  );

  const parseValue = useCallback(
    (input: string, throwIfInvalid: boolean) => {
      if (temporalInfo === undefined) {
        return input;
      } else if (input.trim() === "") {
        if (throwIfInvalid) {
          throw new DataValidationError(
            `a ${temporalInfo.kind} value is required`,
            temporalInfo.kind,
            "empty",
          );
        }
        return undefined;
      }
      return throwIfInvalid
        ? getTypedTemporalValue(input, temporalInfo, true, baseValue)
        : getTypedTemporalValue(input, temporalInfo, false, baseValue);
    },
    [baseValue, temporalInfo],
  );

  return (
    <InputCell
      {...props}
      className={classBase}
      formatValue={formatValue}
      parseValue={parseValue}
      placeholder={
        temporalInfo ? temporalInputPlaceholder(temporalInfo.kind) : undefined
      }
    />
  );
};

registerComponent("temporal-input-cell", TemporalInputCell, "cell-renderer", {
  userCanAssign: false,
});
