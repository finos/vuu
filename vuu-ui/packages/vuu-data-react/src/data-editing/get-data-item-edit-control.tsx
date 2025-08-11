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

export interface DataItemEditControlProps {
  InputProps?: Partial<InputProps>;
  TypeaheadProps?: Pick<VuuTypeaheadInputProps, "highlightFirstSuggestion">;
  className?: string;
  commitWhenCleared?: boolean;
  /**
   * A table column or form field Descriptor.
   */
  dataDescriptor: DataValueDescriptor;
  errorMessage?: string;
  onCommit: CommitHandler<HTMLElement>;
  table?: TableSchemaTable;
}

export type ValidationStatus = "initial" | true | string;

export const getDataItemEditControl = ({
  InputProps,
  TypeaheadProps,
  className,
  commitWhenCleared,
  dataDescriptor,
  errorMessage,
  onCommit,
  table,
}: DataItemEditControlProps) => {
  const handleCommitNumber: CommitHandler<HTMLElement, number> = (
    evt,
    value,
  ) => {
    onCommit(evt, value.toString());
  };

  if (dataDescriptor.editable === false) {
    return (
      <VuuInput
        variant="secondary"
        {...InputProps}
        onCommit={onCommit}
        readOnly
      />
    );
  } else if (isTimeDataValue(dataDescriptor)) {
    return (
      <VuuTimePicker className={className} onCommit={handleCommitNumber} />
    );
  } else if (isDateTimeDataValue(dataDescriptor)) {
    return (
      <VuuDatePicker className={className} onCommit={handleCommitNumber} />
    );
  } else if (dataDescriptor.serverDataType === "string" && table) {
    return (
      <VuuTypeaheadInput
        {...InputProps}
        {...TypeaheadProps}
        className={className}
        column={dataDescriptor.name}
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
      commitWhenCleared={commitWhenCleared}
      onCommit={onCommit}
      errorMessage={errorMessage}
    />
  );
};
