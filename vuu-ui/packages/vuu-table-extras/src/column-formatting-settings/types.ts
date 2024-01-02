import {
  ColumnDescriptor,
  ColumnTypeFormatting,
  ColumnTypeSimple,
} from "@finos/vuu-table-types";

export interface FormattingSettingsProps<
  T extends ColumnDescriptor = ColumnDescriptor
> {
  column: T;
  onChangeFormatting: (formatting: ColumnTypeFormatting) => void;
  onChangeType: (type: ColumnTypeSimple) => void;
}
