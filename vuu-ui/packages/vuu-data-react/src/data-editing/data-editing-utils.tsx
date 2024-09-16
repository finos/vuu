import {
  DataValueDescriptor,
  SuggestionProvider,
  TableSchemaTable,
} from "@finos/vuu-data-types";
import {
  VuuDatePicker,
  VuuInput,
  VuuTypeaheadInput,
} from "@finos/vuu-ui-controls";
import { CommitHandler, isDateTimeDataValue } from "@finos/vuu-utils";
import { InputProps } from "@salt-ds/core";

export interface DataItemEditControlProps {
  InputProps?: Partial<InputProps>;
  /**
   * A table column or form field Descriptor.
   */
  dataDescriptor: DataValueDescriptor;
  errorMessage?: string;
  onCommit: CommitHandler<HTMLInputElement, string | undefined>;
  suggestionProvider?: SuggestionProvider;
  table?: TableSchemaTable;
}

export type ValidationStatus = "initial" | true | string;

export const getDataItemEditControl = ({
  InputProps,
  dataDescriptor,
  errorMessage,
  onCommit,
  suggestionProvider,
  table,
}: DataItemEditControlProps) => {
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
    return <VuuDatePicker onCommit={onCommit as any} />;
  } else if (
    dataDescriptor.serverDataType === "string" &&
    suggestionProvider &&
    table
  ) {
    return (
      <VuuTypeaheadInput
        column={dataDescriptor.name}
        onCommit={onCommit}
        suggestionProvider={suggestionProvider}
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
