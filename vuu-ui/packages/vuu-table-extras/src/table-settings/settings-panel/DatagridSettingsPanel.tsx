import { ColumnDescriptor, GridConfig } from "@finos/vuu-datagrid-types";
import { Button, Panel } from "@salt-ds/core";
import cx from "classnames";
import {
  HTMLAttributes,
  MouseEvent,
  ReactElement,
  useCallback,
  useState,
} from "react";
import { ColumnPicker } from "../column-picker";
import { ColumnSettingsPanel } from "../column-settings-panel";
import { GridSettingsPanel } from "./GridSettingsPanel";
import { useGridSettings } from "./useGridSettings";

import { Stack, StackProps } from "@finos/vuu-layout";
import { CalculatedColumnPanel } from "../calculated-column-panel";

import "./DatagridSettingsPanel.css";

export interface DatagridSettingsPanelProps
  extends HTMLAttributes<HTMLDivElement> {
  availableColumns: ColumnDescriptor[];
  gridConfig: Omit<GridConfig, "headings">;
  onCancel?: () => void;
  onConfigChange?: (
    config: Omit<GridConfig, "headings">,
    closePanel?: boolean
  ) => void;
}

const classBase = "vuuDatagridSettingsPanel";

const getTabLabel = () => undefined;
const icons = [
  "table-settings",
  "column-chooser",
  "column-settings",
  "define-column",
];
const getTabIcon = (component: ReactElement, tabIndex: number) =>
  icons[tabIndex];

// component.props?.title ?? `Tab ${tabIndex + 1}`;

export const DatagridSettingsPanel = ({
  availableColumns,
  className,
  gridConfig,
  onCancel,
  onConfigChange,
  ...props
}: DatagridSettingsPanelProps) => {
  console.log(`DatagridSettingsPanel render`);

  const [selectedTabIndex, setSelectedTabIndex] = useState(0);

  const { gridSettings, dispatchColumnAction } = useGridSettings(gridConfig);

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
      console.log(`1) DataGridSettingsPanel fire onConfigChange`);
      onConfigChange?.(gridSettings, closePanel);
    },
    [gridSettings, onConfigChange]
  );

  const handleTabSelectionChanged = useCallback((selectedTabIndex: number) => {
    setSelectedTabIndex(selectedTabIndex);
  }, []);

  const handleSave = useCallback(
    (evt: MouseEvent) => handleApply(evt, true),
    [handleApply]
  );

  const selectedColumn =
    selectedColumnName === null
      ? null
      : gridSettings.columns.find((col) => col.name === selectedColumnName) ??
        null;

  const tabstripProps: StackProps["TabstripProps"] = {
    activeTabIndex: selectedTabIndex,
    allowRenameTab: false,
    orientation: "vertical",
  };

  const handleAddCalculatedColumn = useCallback(
    () => setSelectedTabIndex(3),
    []
  );

  const panelShift = selectedTabIndex === 2 ? "right" : undefined;

  return (
    <div {...props} className={cx(classBase, className)}>
      <Stack
        TabstripProps={tabstripProps}
        className={`${classBase}-stack`}
        getTabIcon={getTabIcon}
        getTabLabel={getTabLabel}
        active={selectedTabIndex === 2 ? 1 : selectedTabIndex}
        onTabSelectionChanged={handleTabSelectionChanged}
        showTabs
      >
        <GridSettingsPanel
          config={gridSettings}
          dispatchColumnAction={dispatchColumnAction}
        />

        <div className={`${classBase}-columnPanels`} data-align={panelShift}>
          <ColumnPicker
            availableColumns={availableColumns}
            chosenColumns={gridSettings.columns}
            dispatchColumnAction={dispatchColumnAction}
            onSelectionChange={handleColumnSelected}
            onAddCalculatedColumnClick={handleAddCalculatedColumn}
            selectedColumn={selectedColumn}
          />
          {selectedColumn === null ? (
            <Panel className="vuuColumnSettingsPanel">Select a column</Panel>
          ) : (
            <ColumnSettingsPanel
              column={selectedColumn}
              dispatchColumnAction={dispatchColumnAction}
              style={{ background: "white", flex: "1 0 150px" }}
            />
          )}
        </div>
        <div title="Column Settings">Column Settings</div>
        <CalculatedColumnPanel
          columns={gridSettings.columns}
          dispatchColumnAction={dispatchColumnAction}
          table={{ module: "SIMUL", table: "instruments" }}
        />
      </Stack>
      <div className={`${classBase}-buttonBar`}>
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={handleApply}>Apply</Button>
        <Button onClick={handleSave}>Save</Button>
      </div>
    </div>
  );
};
