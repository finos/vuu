import { TableCellRendererProps } from "@finos/vuu-datagrid-types";
import { registerComponent } from "@finos/vuu-utils";
import { Input } from "@salt-ds/core";
import { useEditableText } from "@finos/vuu-ui-controls";

import "./InputCell.css";

const classBase = "vuuTableInputCell";

const WarnCommit = () => {
  console.warn(
    "onCommit handler has not been provided to InputCell cell renderer"
  );
  return true;
};
export const InputCell = ({
  column,
  columnMap,
  onCommit = WarnCommit,
  row,
}: TableCellRendererProps) => {
  const dataIdx = columnMap[column.name];
  const { valueFormatter } = column;

  const editProps = useEditableText({
    initialValue: valueFormatter(row[dataIdx]),
    onCommit,
  });

  return <Input {...editProps} className={classBase} />;
};

registerComponent("input-cell", InputCell, "cell-renderer", {});
