import { TableCellProps } from "@finos/vuu-datagrid-types";
import { registerComponent } from "@finos/vuu-utils";
import { Input } from "@salt-ds/core";
import { FormEventHandler, useCallback, useState } from "react";

import "./InputCell.css";

const classBase = "vuuTableInputCell";

export const InputCell = ({ column, columnMap, row }: TableCellProps) => {
  const dataIdx = columnMap[column.name];
  const { valueFormatter } = column;
  const [value, setValue] = useState(valueFormatter(row[dataIdx]));

  const handleChange = useCallback<FormEventHandler>((evt) => {
    const { value } = evt.target as HTMLInputElement;
    setValue(value);
  }, []);

  return <Input className={classBase} onChange={handleChange} value={value} />;
};

registerComponent("input-cell", InputCell, "cell-renderer", {});
