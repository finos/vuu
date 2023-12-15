import { ColumnDescriptor, ColumnTypeFormatting } from "@finos/vuu-table-types";

export interface FormattingSettingsProps<T extends ColumnDescriptor = ColumnDescriptor> {
  column: T;
  onChange: (formatting: ColumnTypeFormatting) => void;
}
