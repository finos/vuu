import { HTMLAttributes, MouseEvent, useCallback, useState } from "react";
import { ColumnDescriptor, GridConfig } from "@finos/vuu-datagrid-types";
import { ColumnSettingsPanel } from "./ColumnSettingsPanel";
import { useColumns } from "./useColumns";

import "./DatagridSettingsPanel.css";
import { ColumnPicker } from "../column-picker";
import { Button } from "@salt-ds/core";
import { Panel } from "@heswell/salt-lab";

export interface DatagridSettingsPanelProps
  extends HTMLAttributes<HTMLDivElement> {
  availableColumns: ColumnDescriptor[];
  gridConfig: GridConfig;
  onCancel?: () => void;
  onConfigChange?: (config: GridConfig, closePanel?: boolean) => void;
}

const classBase = "vuuDatagridSettingsPanel";

export const DatagridSettingsPanel = ({
  availableColumns,
  gridConfig,
  onCancel,
  onConfigChange,
}: DatagridSettingsPanelProps) => {
  console.log(`DatagridSettingsPanel render`);

  const [config, setConfig] = useState<GridConfig>(gridConfig);

  const { columns: chosenColumns, dispatchColumnAction } = useColumns(
    gridConfig.columns
  );

  const [selectedColumnName, setSelectedColumnName] = useState<string | null>(
    null
  );
  const handleColumnSelected = useCallback(
    (selected: ColumnDescriptor | null) => {
      setSelectedColumnName(selected ? selected.name : null);
    },
    []
  );

  const handleApply = useCallback(
    (evt: MouseEvent, closePanel = false) => {
      onConfigChange?.(
        {
          ...config,
          columns: chosenColumns,
        },
        closePanel
      );
    },
    [chosenColumns, config, onConfigChange]
  );

  const handleSave = useCallback(
    (evt: MouseEvent) => handleApply(evt, true),
    [handleApply]
  );

  const selectedColumn =
    selectedColumnName === null
      ? null
      : chosenColumns.find((col) => col.name === selectedColumnName) ?? null;

  return (
    <div className={classBase}>
      {/* <div className={`${classBase}-header`} /> */}
      <div className={`${classBase}-main`}>
        <ColumnPicker
          availableColumns={availableColumns}
          chosenColumns={chosenColumns}
          dispatchColumnAction={dispatchColumnAction}
          onSelectionChange={handleColumnSelected}
          selectedColumn={selectedColumn}
        />
        {selectedColumn === null ? (
          <Panel style={{ background: "white", flex: "1 0 150px" }}>
            Select a column
          </Panel>
        ) : (
          <ColumnSettingsPanel
            column={selectedColumn}
            dispatchColumnAction={dispatchColumnAction}
            style={{ background: "white", flex: "1 0 150px" }}
          />
        )}
      </div>
      <div className={`${classBase}-buttonBar`}>
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={handleApply}>Apply</Button>
        <Button onClick={handleSave}>Save</Button>
      </div>
    </div>
  );
};
