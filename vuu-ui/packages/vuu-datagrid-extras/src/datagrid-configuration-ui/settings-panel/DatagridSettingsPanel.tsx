import { ColumnDescriptor, GridConfig } from "@finos/vuu-datagrid-types";
import { Panel } from "@heswell/salt-lab";
import { Button, Text } from "@salt-ds/core";
import cx from "classnames";
import {
  HTMLAttributes,
  MouseEvent,
  ReactElement,
  useCallback,
  useState,
} from "react";
import { ColumnPicker } from "../column-picker";
import { ColumnSettingsPanel } from "./ColumnSettingsPanel";
import { useColumns } from "./useColumns";

import "./DatagridSettingsPanel.css";
import { Stack, StackProps } from "@finos/vuu-layout";

export interface DatagridSettingsPanelProps
  extends HTMLAttributes<HTMLDivElement> {
  availableColumns: ColumnDescriptor[];
  gridConfig: GridConfig;
  onCancel?: () => void;
  onConfigChange?: (config: GridConfig, closePanel?: boolean) => void;
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

  const [config, setConfig] = useState<GridConfig>(gridConfig);
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);

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
      : chosenColumns.find((col) => col.name === selectedColumnName) ?? null;

  const tabstripProps: StackProps["TabstripProps"] = {
    activeTabIndex: selectedTabIndex,
    enableRenameTab: false,
    orientation: "vertical",
  };

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
        <Panel className={`${classBase}-gridSettings`} title="Grid Settings">
          <Text styleAs="h4">Grid Settings</Text>
        </Panel>

        <div
          className={`${classBase}-columnPanels`}
          data-align={panelShift}
          title="Choose Columns"
        >
          <ColumnPicker
            availableColumns={availableColumns}
            chosenColumns={chosenColumns}
            dispatchColumnAction={dispatchColumnAction}
            onSelectionChange={handleColumnSelected}
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
        <Panel title="Define Computed Column">
          <Text styleAs="h4">Define Computed Column</Text>
        </Panel>
      </Stack>
      <div className={`${classBase}-buttonBar`}>
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={handleApply}>Apply</Button>
        <Button onClick={handleSave}>Save</Button>
      </div>
    </div>
  );
};
