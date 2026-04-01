import { IconButton, IconButtonProps } from "@vuu-ui/vuu-ui-controls";
import { useCallback } from "react";
import {
  TabbedTableConfigPanelHookProps,
  useTabbedTableConfigPanel,
} from "./useTabbedTableConfigPanel";
import { TableDisplayAttributeChangeHandler } from "../table-settings-panel/TableSettingsPanel";

export interface TabbedTableSettingsActionProps
  extends Partial<IconButtonProps>,
    TabbedTableConfigPanelHookProps {
  onDisplayAttributeChange: TableDisplayAttributeChangeHandler;
}

export const TabbedTableSettingsAction = ({
  allowCreateCalculatedColumn,
  appearance = "transparent",
  columnModel,
  config,
  icon = "settings",
  onDisplayAttributeChange,
  sentiment = "neutral",
  vuuTable,
  ...IconButtonProps
}: TabbedTableSettingsActionProps) => {
  const { showTabbedTableConfigPanel } = useTabbedTableConfigPanel({
    allowCreateCalculatedColumn,
    columnModel,
    config,
    onDisplayAttributeChange,
    vuuTable,
  });

  const handleClick = useCallback(() => {
    showTabbedTableConfigPanel();
  }, [showTabbedTableConfigPanel]);

  return (
    <IconButton
      {...IconButtonProps}
      appearance={appearance}
      data-action="table-settings"
      icon={icon}
      onClick={handleClick}
      sentiment={sentiment}
      size={20}
    />
  );
};
