import { Button } from "@salt-ds/core";
import { VuuTable } from "@vuu-ui/vuu-protocol-types";
import type { TableProps } from "@vuu-ui/vuu-table";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import cx from "clsx";
import { HTMLAttributes, SyntheticEvent, useCallback, useState } from "react";
import { useEditCalculatedColumn } from "../calculated-column/useEditCalculatedColumn";
import { ColumnPicker, ColumnPickerProps } from "../column-picker/ColumnPicker";
import { ColumnSettingsPanel } from "../column-settings-panel/ColumnSettingsPanel";
import {
  ConfigPanelTab,
  TabbedConfigPanel,
} from "../tabbed-config-panel/TabbedConfigPanel";
import {
  TableSettingsPanel,
  TableSettingsPanelProps,
} from "../table-settings-panel/TableSettingsPanel";

export type TabbedTableConfigPanelTab =
  | "table-settings"
  | "table-columns"
  | "column-settings";

const classBase = "vuuTabbedTableConfigPanel";
export interface TabbedTableConfigPanelProps
  extends Pick<ColumnPickerProps, "columnModel" | "columnSetModel">,
    Pick<TableSettingsPanelProps, "onDisplayAttributeChange">,
    Pick<TableProps, "config">,
    Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> {
  allowCreateCalculatedColumn?: boolean;
  selectedTab?: TabbedTableConfigPanelTab;
  vuuTable?: VuuTable;
}

/**
 * Table settings, table columns and column settings, as a TabbedConfigPanel.
 * To choose the tabs, or add others, compose a TabbedConfigPanel instead.
 */
export const TabbedTableConfigPanel = ({
  allowCreateCalculatedColumn = false,
  className,
  columnModel,
  columnSetModel,
  config,
  onDisplayAttributeChange,
  selectedTab = "table-settings",
  vuuTable,
  ...htmlAttributes
}: TabbedTableConfigPanelProps) => {
  const [columns, setColumns] = useState<ColumnDescriptor[]>([]);
  const [value, setValue] = useState<string>(selectedTab);

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
    <TabbedConfigPanel
      {...htmlAttributes}
      className={cx(classBase, className)}
      onChange={setValue}
      tabListLabel="Table configuration"
      value={value}
    >
      <ConfigPanelTab label="Table settings" value="table-settings">
        <TableSettingsPanel
          onDisplayAttributeChange={onDisplayAttributeChange}
          tableDisplayAttributes={config}
        />
      </ConfigPanelTab>
      <ConfigPanelTab label="Table columns" value="table-columns">
        <ColumnPicker
          columnModel={columnModel}
          columnSetModel={columnSetModel}
          onSelectionChange={handleSelectionChange}
          selected={columns}
        />
        {allowCreateCalculatedColumn ? (
          <div className={`${classBase}-column-buttons`}>
            <Button onClick={onCreateCalculatedColumn}>
              Create calculated column
            </Button>
          </div>
        ) : null}
      </ConfigPanelTab>
      <ConfigPanelTab
        disabled={columns.length === 0}
        label="Column settings"
        value="column-settings"
      >
        {columns.length > 0 ? (
          <ColumnSettingsPanel
            column={columns[0]}
            columnModel={columnModel}
            onClickEditCalculatedColumn={onEditCalculatedColumn}
          />
        ) : null}
      </ConfigPanelTab>
    </TabbedConfigPanel>
  );
};
