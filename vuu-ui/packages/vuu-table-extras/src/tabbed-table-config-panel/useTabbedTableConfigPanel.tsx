import { useCallback, useRef } from "react";
import { useContextPanel } from "@vuu-ui/vuu-ui-controls";
import { TabbedTableConfigPanel } from "./TabbedTableConfigPanel";
import { TableSettingsPanelProps } from "../table-settings-panel/TableSettingsPanel";
import { TableProps } from "@vuu-ui/vuu-table";
import { ColumnPickerProps } from "../column-picker/ColumnPicker";
import { VuuTable } from "@vuu-ui/vuu-protocol-types";

export interface TabbedTableConfigPanelHookProps
  extends Pick<
      ColumnPickerProps,
      "allowCreateCalculatedColumn" | "columnModel"
    >,
    Pick<TableSettingsPanelProps, "onDisplayAttributeChange">,
    Pick<TableProps, "config"> {
  /**
   * only required for calculated columns
   */
  vuuTable?: VuuTable;
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
