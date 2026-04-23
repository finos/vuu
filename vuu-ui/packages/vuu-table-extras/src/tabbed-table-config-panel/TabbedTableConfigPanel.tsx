import {
  TabListNext,
  TabNext,
  TabNextPanel,
  TabNextTrigger,
  TabsNext,
} from "@salt-ds/lab";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { VuuTable } from "@vuu-ui/vuu-protocol-types";
import type { TableProps } from "@vuu-ui/vuu-table";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import cx from "clsx";
import { HTMLAttributes, SyntheticEvent, useCallback, useState } from "react";
import { useEditCalculatedColumn } from "../calculated-column/useEditCalculatedColumn";
import { ColumnPicker, ColumnPickerProps } from "../column-picker/ColumnPicker";
import { ColumnSettingsPanel } from "../column-settings-panel/ColumnSettingsPanel";
import {
  TableSettingsPanel,
  TableSettingsPanelProps,
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
      <TabsNext onChange={handleChange} value={value}>
        <TabListNext appearance="transparent">
          <TabNext value="table-settings">
            <TabNextTrigger>Table settings</TabNextTrigger>
          </TabNext>
          <TabNext value="table-columns">
            <TabNextTrigger>Table columns</TabNextTrigger>
          </TabNext>
          <TabNext disabled={columns.length === 0} value="column-settings">
            <TabNextTrigger>Column settings</TabNextTrigger>
          </TabNext>
        </TabListNext>
        <TabNextPanel value="table-settings">
          <TableSettingsPanel
            onDisplayAttributeChange={onDisplayAttributeChange}
            tableDisplayAttributes={config}
          />
        </TabNextPanel>
        <TabNextPanel value="table-columns">
          <ColumnPicker
            allowCreateCalculatedColumn={allowCreateCalculatedColumn}
            columnModel={columnModel}
            onClickCreateCalculatedColumn={onCreateCalculatedColumn}
            onSelectionChange={handleSelectionChange}
            selected={columns}
          />
        </TabNextPanel>
        <TabNextPanel value="column-settings">
          {columns.length > 0 ? (
            <ColumnSettingsPanel
              column={columns[0]}
              columnModel={columnModel}
              onClickEditCalculatedColumn={onEditCalculatedColumn}
            />
          ) : null}
        </TabNextPanel>
      </TabsNext>
    </div>
  );
};
