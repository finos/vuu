import type {
  DataValueDescriptor,
  DataValueEditor,
  TableSchemaTable,
  TypeaheadEditor,
} from "@vuu-ui/vuu-data-types";
import type {
  LookupRenderer,
  ValueListRenderer,
} from "@vuu-ui/vuu-table-types";
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
import { EditControlCheckbox } from "./EditControlCheckbox";
import { EditControlDropdown } from "./EditControlDropdown";
import { EditControlLookupDropdown } from "./EditControlLookupDropdown";

/**
 * A rendering hint for the typeahead used in filters, shorthand for
 * `minCharacterCountToTriggerSuggestions`.
 * 'search' needs a character typed before suggestions show (1),
 * 'pick' shows them on focus, like a dropdown (0).
 */
export type DataItemEditControlVariant = "search" | "pick";

const VARIANT_MIN_CHARACTER_COUNT: Record<
  DataItemEditControlVariant | "default",
  0 | 1 | undefined
> = { default: undefined, pick: 0, search: 1 };

/**
 * - "edit" (default): editing a value. Booleans are edited with a checkbox,
 *   and a typeahead is used only when the descriptor's `editor` asks for one.
 * - "filter": entering a filter value. Every string column on a Vuu table
 *   gets a typeahead, suggesting the values present in the table.
 */
export type DataItemEditControlPurpose = "edit" | "filter";

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
   * A table column or form field Descriptor. Its `editor`, when present,
   * determines the control.
   */
  dataDescriptor: DataValueDescriptor;
  editOperation?: "insert" | "update";
  errorMessage?: string;
  onCommit: CommitHandler<HTMLElement>;
  /** @default "edit" */
  purpose?: DataItemEditControlPurpose;
  /** The table the value belongs to. Required for a typeahead. */
  table?: TableSchemaTable;
  variant?: DataItemEditControlVariant;
}

const isTypeaheadEditor = (
  editor?: DataValueEditor,
): editor is TypeaheadEditor => editor?.name === "typeahead";
const isValueListEditor = (
  editor?: DataValueEditor,
): editor is ValueListRenderer =>
  Array.isArray((editor as ValueListRenderer | undefined)?.values);
const isLookupEditor = (editor?: DataValueEditor): editor is LookupRenderer =>
  (editor as LookupRenderer | undefined)?.lookup !== undefined;
const isCheckboxEditor = (editor?: DataValueEditor) =>
  editor?.name === "checkbox-cell" || editor?.name === "toggle-cell";

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
  purpose = "edit",
  table,
  variant,
}: DataItemEditControlProps) => {
  const { editor } = dataDescriptor;
  const temporalInfo = getTemporalInfo(dataDescriptor);
  const value = InputProps?.value ?? InputProps?.inputProps?.value;

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
  } else if (
    purpose === "edit" &&
    (isCheckboxEditor(editor) ||
      (editor === undefined && dataDescriptor.serverDataType === "boolean"))
  ) {
    return (
      <EditControlCheckbox
        className={className}
        onCommit={onCommit}
        value={value}
      />
    );
  } else if (isLookupEditor(editor)) {
    return (
      <EditControlLookupDropdown
        className={className}
        lookup={editor.lookup}
        onCommit={onCommit}
        value={value}
      />
    );
  } else if (isValueListEditor(editor)) {
    return (
      <EditControlDropdown
        className={className}
        onCommit={onCommit}
        value={value}
        values={editor.values}
      />
    );
  } else if (
    table &&
    (isTypeaheadEditor(editor) ||
      (purpose === "filter" && dataDescriptor.serverDataType === "string"))
  ) {
    const minCharacterCountToTriggerSuggestions =
      TypeaheadProps?.minCharacterCountToTriggerSuggestions ??
      (isTypeaheadEditor(editor)
        ? editor.minCharacterCountToTriggerSuggestions
        : undefined) ??
      VARIANT_MIN_CHARACTER_COUNT[variant ?? "default"];
    return (
      <VuuTypeaheadInput
        {...InputProps}
        {...TypeaheadProps}
        className={className}
        column={dataDescriptor.name}
        data-edit-control
        data-variant={variant}
        minCharacterCountToTriggerSuggestions={
          minCharacterCountToTriggerSuggestions
        }
        onCommit={onCommit}
        table={table}
      />
    );
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
