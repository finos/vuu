import { SuggestionProvider, TableSchemaTable } from "@finos/vuu-data-types";
import { ColumnDescriptor } from "@finos/vuu-table-types";
import {
  VuuDatePicker,
  VuuInput,
  VuuTypeaheadInput
} from "@finos/vuu-ui-controls";
import { CommitHandler, isDateTimeColumn } from "@finos/vuu-utils";
import { InputProps } from "@salt-ds/core";

export interface DataItemEditControlProps {
  InputProps?: Partial<InputProps>;
  column: ColumnDescriptor;
  onCommit: CommitHandler<HTMLInputElement, string | undefined>;
  suggestionProvider?: SuggestionProvider;
  table?: TableSchemaTable;
}

export const getDataItemEditControl = ({
  InputProps,
  column,
  onCommit,
  suggestionProvider,
  table
}: DataItemEditControlProps) => {
  if (isDateTimeColumn(column)) {
    return <VuuDatePicker onCommit={onCommit as any} />;
  } else if (
    column.serverDataType === "string" &&
    suggestionProvider &&
    table
  ) {
    return (
      <VuuTypeaheadInput
        column={column.name}
        onCommit={onCommit}
        suggestionProvider={suggestionProvider}
        table={table}
      />
    );
  }
  return <VuuInput variant="secondary" {...InputProps} onCommit={onCommit} />;
};
