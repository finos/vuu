import { ColumnDescriptor } from "@finos/vuu-table-types";
import {
  VuuDatePicker,
  VuuInput,
  VuuTypeaheadInput,
} from "@finos/vuu-ui-controls";
import { SuggestionProvider, TableSchemaTable } from "@finos/vuu-data-types";
import { CommitHandler, isDateTimeColumn } from "@finos/vuu-utils";

export interface DataItemEditControlProps {
  column: ColumnDescriptor;
  onCommit: CommitHandler<HTMLInputElement, string | undefined>;
  suggestionProvider?: SuggestionProvider;
  table?: TableSchemaTable;
}

export const getDataItemEditControl = ({
  column,
  onCommit,
  suggestionProvider,
  table,
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

  return (
    <VuuInput
      data-field={column.name}
      onCommit={onCommit}
      variant="secondary"
    />
  );
};
