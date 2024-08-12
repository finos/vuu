import { ColumnDescriptor } from "@finos/vuu-table-types";
import {
  type CommitHandler,
  VuuInput,
  VuuTypeaheadInput,
} from "@finos/vuu-ui-controls";
import { SuggestionProvider, TableSchemaTable } from "@finos/vuu-data-types";

export interface DataItemEditControlProps {
  column: ColumnDescriptor;
  onCommit: CommitHandler;
  suggestionProvider?: SuggestionProvider;
  table?: TableSchemaTable;
}

export const getDataItemEditControl = ({
  column,
  onCommit,
  suggestionProvider,
  table,
}: DataItemEditControlProps) => {
  if (column.serverDataType === "string" && suggestionProvider && table) {
    return (
      <VuuTypeaheadInput
        column={column.name}
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
