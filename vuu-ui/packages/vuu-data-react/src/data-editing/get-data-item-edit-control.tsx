import type {
  DataValueDescriptor,
  TableSchemaTable,
} from "@finos/vuu-data-types";
import {
  VuuDatePicker,
  VuuInput,
  VuuTypeaheadInput,
  VuuTypeaheadInputProps,
} from "@finos/vuu-ui-controls";
import { CommitHandler, isDateTimeDataValue } from "@finos/vuu-utils";
import { InputProps } from "@salt-ds/core";

export interface DataItemEditControlProps {
  InputProps?: Partial<InputProps>;
  TypeaheadProps?: Pick<VuuTypeaheadInputProps, "highlightFirstSuggestion">;
  /**
   * A table column or form field Descriptor.
   */
  dataDescriptor: DataValueDescriptor;
  errorMessage?: string;
  onCommit: CommitHandler<HTMLElement, string | undefined>;
  table?: TableSchemaTable;
}

export type ValidationStatus = "initial" | true | string;

export const getDataItemEditControl = ({
  InputProps,
  TypeaheadProps,
  dataDescriptor,
  errorMessage,
  onCommit,
  table,
}: DataItemEditControlProps) => {
  const handleCommitNumber: CommitHandler<HTMLElement, number> = (
    evt,
    value,
  ) => {
    console.log(`value`);
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
  } else if (isDateTimeDataValue(dataDescriptor)) {
    return <VuuDatePicker onCommit={handleCommitNumber} />;
  } else if (dataDescriptor.serverDataType === "string" && table) {
    return (
      <VuuTypeaheadInput
        {...InputProps}
        {...TypeaheadProps}
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
      onCommit={onCommit}
      errorMessage={errorMessage}
    />
  );
};
