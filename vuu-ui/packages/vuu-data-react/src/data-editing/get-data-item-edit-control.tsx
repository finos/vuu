import type {
  DataValueDescriptor,
  TableSchemaTable,
} from "@vuu-ui/vuu-data-types";
import {
  VuuDatePicker,
  VuuInput,
  VuuTimePicker,
  VuuTypeaheadInput,
  VuuTypeaheadInputProps,
} from "@vuu-ui/vuu-ui-controls";
import {
  CommitHandler,
  isDateTimeDataValue,
  isTimeDataValue,
} from "@vuu-ui/vuu-utils";
import { InputProps } from "@salt-ds/core";
import { asTimeString } from "@vuu-ui/vuu-utils";
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

export type ValidationStatus = "initial" | true | string;

export const getDataItemEditControl = ({
  InputProps,
  TypeaheadProps,
  className,
  commitOnBlur,
  commitWhenCleared,
  dataDescriptor,
  errorMessage,
  onCommit,
  table,
  values,
  variant,
}: DataItemEditControlProps) => {
  const handleCommitNumber: CommitHandler<HTMLElement, number> = (
    evt,
    value,
  ) => {
    onCommit(evt, value.toString());
  };

  const dataVariant = variant && variant !== "toggle" ? variant : undefined;

  if (dataDescriptor.editable === false) {
    return (
      <VuuInput
        variant="secondary"
        {...InputProps}
        onCommit={onCommit}
        readOnly
        data-edit-control
      />
    );
  } else if (isTimeDataValue(dataDescriptor)) {
    if (InputProps?.inputProps) {
      const { value, onChange } = InputProps.inputProps;
      return (
        <VuuTimePicker
          className={className}
          value={asTimeString(value, true)}
          onChange={onChange}
          onCommit={onCommit}
          data-edit-control
        />
      );
    }
  } else if (isDateTimeDataValue(dataDescriptor)) {
    return (
      <VuuDatePicker
        className={className}
        onCommit={handleCommitNumber}
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
