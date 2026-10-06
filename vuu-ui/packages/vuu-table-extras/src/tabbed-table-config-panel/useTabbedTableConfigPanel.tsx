import { VuuTable } from "@vuu-ui/vuu-protocol-types";
import { TableProps } from "@vuu-ui/vuu-table";
import { useContextPanel } from "@vuu-ui/vuu-ui-controls";
import { useCallback, useRef } from "react";
import { ColumnPickerProps } from "../column-picker/ColumnPicker";
import { TableSettingsPanelProps } from "../table-settings-panel/TableSettingsPanel";
import { TabbedTableConfigPanel } from "./TabbedTableConfigPanel";

export interface TabbedTableConfigPanelHookProps
  extends
    Pick<ColumnPickerProps, "columnModel">,
    Pick<TableSettingsPanelProps, "onDisplayAttributeChange">,
    Pick<TableProps, "config"> {
  /**
   * only required for calculated columns
   */
  vuuTable?: VuuTable;
  allowCreateCalculatedColumn?: boolean;
}

export const useTabbedTableConfigPanel = ({
  allowCreateCalculatedColumn,
  columnModel,
  config,
  onDisplayAttributeChange,
  vuuTable,
}: TabbedTableConfigPanelHookProps) => {
  const showContextPanel = useContextPanel();
  //   const hideContextPanel = useHideContextPanel();
  const contextPanelShowing = useRef(false);

  const showTabbedTableConfigPanel = useCallback(
    (title = "Table settings") => {
      contextPanelShowing.current = true;
      showContextPanel(
        <TabbedTableConfigPanel
          allowCreateCalculatedColumn={allowCreateCalculatedColumn}
          columnModel={columnModel}
          config={config}
          onDisplayAttributeChange={onDisplayAttributeChange}
          vuuTable={vuuTable}
        />,
        title,
      );
    },
    [
      allowCreateCalculatedColumn,
      columnModel,
      config,
      onDisplayAttributeChange,
      showContextPanel,
      vuuTable,
    ],
  );

  return {
    showTabbedTableConfigPanel,
  };
};
