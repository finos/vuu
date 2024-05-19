import { ColumnDescriptor } from "@finos/vuu-table-types";
import { Commithandler, VuuInput } from "@finos/vuu-ui-controls";

export interface DataItemEditControlProps {
  column: ColumnDescriptor;
  onCommit: Commithandler;
}

export const getDataItemEditControl = ({
  column,
  onCommit,
}: DataItemEditControlProps) => {
  switch (column.serverDataType) {
    default:
      return (
        <VuuInput
          data-field={column.name}
          onCommit={onCommit}
          variant="secondary"
        />
      );
  }
};
