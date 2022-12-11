import { HTMLAttributes, useCallback, useState } from "react";
import { KeyedColumnDescriptor } from "../../grid-model";
import { ColumnSettingsPanel } from "./ColumnSettingsPanel";

import "./DatagridSettingsPanel.css";
import { ColumnPicker } from "./ColumnPicker";
import { Button } from "@salt-ds/core";

export type GridConfig = {
  columns: KeyedColumnDescriptor[];
};

export interface DatagridSettingsPanelProps
  extends HTMLAttributes<HTMLDivElement> {
  availableColumns: KeyedColumnDescriptor[];
  gridConfig: GridConfig;
  onConfigChange: (config: GridConfig) => void;
}

const classBase = "vuuDatagridSettingsPanel";

//TODO we only need the listContainer because LIst will not allow us to make it 100% height

export const DatagridSettingsPanel = ({
  availableColumns,
  gridConfig,
  onConfigChange,
}: DatagridSettingsPanelProps) => {
  console.log({ availableColumns, gridConfig });

  const [config, setConfig] = useState<GridConfig>(gridConfig);
  const [selectedColumn, setSelectedColumn] =
    useState<KeyedColumnDescriptor | null>(null);
  const handleColumnSelected = useCallback(
    (evt, selected: KeyedColumnDescriptor) => {
      setSelectedColumn(selected);
    },
    []
  );

  const handleApply = useCallback(() => {
    onConfigChange?.(config);
  }, [config, onConfigChange]);

  return (
    <div className={classBase}>
      <div className={`${classBase}-header`} />
      <div className={`${classBase}-main`}>
        <ColumnPicker
          availableColumns={availableColumns}
          onSelectionChange={handleColumnSelected}
          selectedColumns={gridConfig.columns}
        />
        <ColumnSettingsPanel
          style={{ background: "white", flex: "0 0 150px" }}
          column={selectedColumn}
        />
      </div>
      <div className={`${classBase}-buttonBar`}>
        <Button>Cancel</Button>
        <Button onClick={handleApply}>Apply</Button>
        <Button>Save</Button>
      </div>
    </div>
  );
};
