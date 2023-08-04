import { ComboBox } from "@salt-ds/lab";
import { ColumnDescriptor } from "@finos/vuu-datagrid-types";

import "./ColumnSelector.css";
import { HTMLAttributes, SyntheticEvent, useCallback, useState } from "react";

const classBase = "vuuFilterColumnSelector";

export interface ColumnSelectorProps extends HTMLAttributes<HTMLDivElement> {
  columns: ColumnDescriptor[];
}

export const ColumnSelector = ({ columns }: ColumnSelectorProps) => {
  const [selectedColumn, setSelectedColumn] = useState<ColumnDescriptor | null>(
    null
  );

  const handleSelectionChange = useCallback(
    (evt: SyntheticEvent, selected: ColumnDescriptor | null) => {
      console.log(`handleSelectionChange`, {
        evt,
        selected,
      });
      setSelectedColumn(selectedColumn);
      //   if (!selectedColumn) return;
      //   setTimeout(() => {
      //     inputRef.current?.querySelector("input")?.focus();
      //   }, 300);
    },
    []
  );

  return (
    <div className={classBase} data-text="steve">
      <ComboBox<ColumnDescriptor, "deselectable">
        ListProps={{
          displayedItemCount: 10,
          width: 200,
        }}
        source={columns}
        itemToString={(column) => column.name}
        InputProps={{
          highlightOnFocus: true,
          inputProps: { autoComplete: "off" },
        }}
        onSelectionChange={handleSelectionChange}
        selectionStrategy="deselectable"
        // getFilterRegex={selectedColumn && (() => /.*/)}
      />
    </div>
  );
};
