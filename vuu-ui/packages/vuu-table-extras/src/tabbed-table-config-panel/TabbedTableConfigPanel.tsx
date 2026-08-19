import {
  TabList,
  Tab,
  TabPanel,
  TabTrigger,
  Tabs,
} from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import type { VuuTable } from "@vuu-ui/vuu-protocol-types";
import type { TableProps } from "@vuu-ui/vuu-table";
import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import cx from "clsx";
import { type HTMLAttributes, type SyntheticEvent, useCallback, useState } from "react";
import { useEditCalculatedColumn } from "../calculated-column/useEditCalculatedColumn";
import { ColumnPicker, type ColumnPickerProps } from "../column-picker/ColumnPicker";
import { ColumnSettingsPanel } from "../column-settings-panel/ColumnSettingsPanel";
import {
  TableSettingsPanel,
  type TableSettingsPanelProps,
} from "../table-settings-panel/TableSettingsPanel";

import css from "./TabbedTableConfigPanel.css";

const TabLabels = {
  "table-settings": "Table",
  "table-columns": "Columns",
} as const;

type TabName = keyof typeof TabLabels;

const classBase = "vuuTabbedTableConfigPanel";
export interface TabbedTableConfigPanelProps
  extends ColumnPickerProps,
  Pick<TableSettingsPanelProps, "onDisplayAttributeChange">,
  Pick<TableProps, "config">,
  HTMLAttributes<HTMLDivElement> {
  allowCreateCalculatedColumn?: boolean;
  selectedTab?: TabName;
  vuuTable?: VuuTable;
}

export const TabbedTableConfigPanel = ({
  allowCreateCalculatedColumn = false,
  className,
  columnModel,
  config,
  onDisplayAttributeChange,
  selectedTab = "table-settings",
  vuuTable,
  ...htmlAttributes
}: TabbedTableConfigPanelProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-tabbed-table-config-panel",
    css,
    window: targetWindow,
  });

  const [columns, setColumns] = useState<ColumnDescriptor[]>([]);

  const [value, setValue] = useState<string>(selectedTab);
  const handleChange = useCallback(
    (_e: SyntheticEvent | null, value: string) => {
      setValue(value);
    },
    [],
  );

  const handleSelectionChange = useCallback(
    (_e: SyntheticEvent, selectedItems: ColumnDescriptor[]) => {
      setColumns(selectedItems);
    },
    [],
  );

  const handleSaveCalculatedColumn = useCallback((column: ColumnDescriptor) => {
    setColumns([column]);
  }, []);

  const { onCreateCalculatedColumn, onEditCalculatedColumn } =
    useEditCalculatedColumn({
      columnModel,
      calculatedColumn: columns[0],
      onSaveColumn: handleSaveCalculatedColumn,
      vuuTable,
    });

  return (
    <div {...htmlAttributes} className={cx(classBase, className)}>
      <Tabs onChange={handleChange} value={value}>
        <TabList appearance="transparent">
          <Tab value="table-settings">
            <TabTrigger>Table settings</TabTrigger>
          </Tab>
          <Tab value="table-columns">
            <TabTrigger>Table columns</TabTrigger>
          </Tab>
          <Tab disabled={columns.length === 0} value="column-settings">
            <TabTrigger>Column settings</TabTrigger>
          </Tab>
        </TabList>
        <TabPanel value="table-settings">
          <TableSettingsPanel
            onDisplayAttributeChange={onDisplayAttributeChange}
            tableDisplayAttributes={config}
          />
        </TabPanel>
        <TabPanel value="table-columns">
          <ColumnPicker
            allowCreateCalculatedColumn={allowCreateCalculatedColumn}
            columnModel={columnModel}
            onClickCreateCalculatedColumn={onCreateCalculatedColumn}
            onSelectionChange={handleSelectionChange}
            selected={columns}
          />
        </TabPanel>
        <TabPanel value="column-settings">
          {columns.length > 0 ? (
            <ColumnSettingsPanel
              column={columns[0]}
              columnModel={columnModel}
              onClickEditCalculatedColumn={onEditCalculatedColumn}
            />
          ) : null}
        </TabPanel>
      </Tabs>
    </div>
  );
};
