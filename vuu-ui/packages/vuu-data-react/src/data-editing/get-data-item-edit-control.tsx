import type {
  DataValueDescriptor,
  TableSchemaTable,
} from "@vuu-ui/vuu-data-types";
import {
  VuuDatePicker,
  VuuInput,
  VuuTimePicker,
  VuuTypeaheadInput,
  type VuuTypeaheadInputProps,
} from "@vuu-ui/vuu-ui-controls";
import {
  type CommitHandler,
  EpochTimestamp,
  getTemporalInfo,
  isDataValueEditable,
  isTimeDataValueWithMilliseconds,
  isValidTimeString,
  isValidTimeStringMillis,
  parseTemporalInput,
  type TemporalInfo,
  type TimeString,
  type TimeStringMillis,
} from "@vuu-ui/vuu-utils";
import type { InputProps } from "@salt-ds/core";
import { ToggleFilter } from "@vuu-ui/vuu-filters";

/**
 * variant can be used to provide a rendering hint to the filter control rendered.
 * 'toggle' for A ToggleButtonGroup, only suitable for up to 3 value choices
 * 'search' to render a search icon and require at least one character to be entered.
 * 'pick' to show a dropdown list, even before any text is entered, best for smaller lists
 */
export type FilterControlVariant = "search" | "pick" | "toggle";
export interface DataItemEditControlProps {
  InputProps?: Partial<InputProps>;
  TypeaheadProps?: Pick<
    VuuTypeaheadInputProps,
    | "highlightFirstSuggestion"
    | "minCharacterCountToTriggerSuggestions"
    | "selectOnTab"
  >;
  className?: string;
  commitOnBlur?: boolean;
  commitWhenCleared?: boolean;
  /**
   * A table column or form field Descriptor.
   */
  dataDescriptor: DataValueDescriptor;
  editOperation?: "insert" | "update";
  errorMessage?: string;
  onCommit: CommitHandler<HTMLElement>;
  table?: TableSchemaTable;
  /**
   * Where provided, only these values will be offered as suggestions.
   * They will be validated against server with Typeahead service, so
   * unavailable options are not offered.
   * Recommended for toggle filters, not usually necessary for other
   * filter variants.
   */
  values?: string[];
  variant?: FilterControlVariant;
}

const timeOfDayPattern = /^\d{2}:\d{2}(:\d{2}(\.\d{1,9})?)?$/;

/**
 * Value is an epoch timestamp (wire encoding), as opposed to a TimeString
 */
const toEpochTimestamp = (
  value: unknown,
  { encoding }: TemporalInfo,
): EpochTimestamp | undefined => {
  if (
    (typeof value === "string" || typeof value === "number") &&
    !timeOfDayPattern.test(`${value}`)
  ) {
    return EpochTimestamp.fromWire(value, encoding);
  }
};

const pad = (n: number) => `${n}`.padStart(2, "0");

function toTimeString(
  value: unknown,
  timestamp: EpochTimestamp | undefined,
  temporalInfo: TemporalInfo,
  milliseconds: true,
): TimeStringMillis | undefined;
function toTimeString(
  value: unknown,
  timestamp: EpochTimestamp | undefined,
  temporalInfo: TemporalInfo,
  milliseconds?: false,
): TimeString | undefined;
function toTimeString(
  value: unknown,
  timestamp: EpochTimestamp | undefined,
  { timeZone }: TemporalInfo,
  milliseconds = false,
): TimeString | TimeStringMillis | undefined {
  if (timestamp) {
    const { hour, minute, second, millisecond } = timestamp.getFields(timeZone);
    const timeString = `${pad(hour)}:${pad(minute)}:${pad(second)}`;
    return milliseconds
      ? (`${timeString}.${`${millisecond}`.padStart(3, "0")}` as TimeStringMillis)
      : (timeString as TimeString);
  } else if (typeof value === "string") {
    if (milliseconds) {
      const timeString =
        value.length === 8 ? `${value}.000` : value.slice(0, 12);
      if (isValidTimeStringMillis(timeString)) {
        return timeString;
      }
    } else {
      const timeString = value.slice(0, 8);
      if (isValidTimeString(timeString)) {
        return timeString;
      }
    }
  }
}

export type ValidationStatus = "initial" | true | string;

export const getDataItemEditControl = ({
  InputProps,
  TypeaheadProps,
  className,
  commitOnBlur,
  commitWhenCleared,
  dataDescriptor,
  editOperation = "update",
  errorMessage,
  onCommit,
  table,
  values,
  variant,
}: DataItemEditControlProps) => {
  const dataVariant = variant && variant !== "toggle" ? variant : undefined;
  const temporalInfo = getTemporalInfo(dataDescriptor);

  // WOnb't this prevent a filter on an non-editable field ?
  if (!isDataValueEditable(dataDescriptor, editOperation, true)) {
    return (
      <VuuInput
        variant="secondary"
        {...InputProps}
        onCommit={onCommit}
        readOnly
        data-edit-control
      />
    );
  } else if (temporalInfo?.kind === "time") {
    const { value, onChange } = InputProps?.inputProps ?? {};
    const baseValue = toEpochTimestamp(value, temporalInfo);
    const handleCommitTime: CommitHandler<
      HTMLInputElement,
      TimeString | TimeStringMillis
    > = (evt, timeString) => {
      if (baseValue) {
        // We are editing a timestamp value, apply the time to the existing date
        const timestamp = parseTemporalInput(
          timeString,
          temporalInfo,
          baseValue,
        );
        onCommit(
          evt,
          timestamp ? `${timestamp.toWire(temporalInfo.encoding)}` : "",
        );
      } else {
        // Filters use a TimeString value, resolved to today when query is created
        onCommit(evt, timeString);
      }
    };
    return isTimeDataValueWithMilliseconds(dataDescriptor) ? (
      <VuuTimePicker
        className={className}
        milliseconds
        value={
          value === ""
            ? ("" as TimeStringMillis)
            : toTimeString(value, baseValue, temporalInfo, true)
        }
        onChange={onChange}
        onCommit={handleCommitTime}
        data-edit-control
      />
    ) : (
      <VuuTimePicker
        className={className}
        value={
          value === ""
            ? ("" as TimeString)
            : toTimeString(value, baseValue, temporalInfo)
        }
        onChange={onChange}
        onCommit={handleCommitTime}
        data-edit-control
      />
    );
  } else if (temporalInfo) {
    const baseValue = toEpochTimestamp(
      InputProps?.inputProps?.value,
      temporalInfo,
    );
    const handleCommitDate: CommitHandler<HTMLElement, number> = (
      evt,
      startOfDayMillis,
    ) => {
      let timestamp = EpochTimestamp.fromMillis(startOfDayMillis);
      if (baseValue && temporalInfo.kind === "datetime") {
        // preserve the time of day of the value being edited
        const { year, month, day } = timestamp.getFields(temporalInfo.timeZone);
        const { hour, minute, second, millisecond } = baseValue.getFields(
          temporalInfo.timeZone,
        );
        timestamp = EpochTimestamp.fromFields(
          { year, month, day, hour, minute, second, millisecond },
          temporalInfo.timeZone,
          baseValue.subMilliNanos,
        );
      }
      onCommit(evt, `${timestamp.toWire(temporalInfo.encoding)}`);
    };
    return (
      <VuuDatePicker
        className={className}
        onCommit={handleCommitDate}
        timeZone={temporalInfo.timeZone}
        value={baseValue}
        data-edit-control
      />
    );
  } else if (dataDescriptor.serverDataType === "string" && table) {
    if (variant === "toggle" && values?.length) {
      return (
        <ToggleFilter
          className={className}
          column={dataDescriptor.name}
          data-edit-control
          onCommit={onCommit}
          table={table}
          values={values}
          value={InputProps?.inputProps?.value ?? "all"}
        />
      );
    } else {
      return (
        <VuuTypeaheadInput
          {...InputProps}
          {...TypeaheadProps}
          className={className}
          column={dataDescriptor.name}
          data-edit-control
          data-variant={dataVariant}
          onCommit={onCommit}
          table={table}
        />
      );
    }
  }

  return (
    <VuuInput
      variant="secondary"
      {...InputProps}
      className={className}
      commitOnBlur={commitOnBlur}
      commitWhenCleared={commitWhenCleared}
      onCommit={onCommit}
      errorMessage={errorMessage}
      data-edit-control
    />
  );
};
