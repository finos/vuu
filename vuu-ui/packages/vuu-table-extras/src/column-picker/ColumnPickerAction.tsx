import { IconButton, IconButtonProps } from "@vuu-ui/vuu-ui-controls";
import { ColumnPickerHookProps } from "./useColumnPicker";
import { useCallback } from "react";
import { useTableColumnPicker } from "./useTableColumnPicker";

export interface ColumnPickerActionProps
  extends Partial<IconButtonProps>,
    ColumnPickerHookProps {}

export const ColumnPickerAction = ({
  appearance = "transparent",
  columnModel,
  icon = "settings",
  sentiment = "neutral",
  ...IconButtonProps
}: ColumnPickerActionProps) => {
  const { showColumnPicker } = useTableColumnPicker({ columnModel });

  const handleClick = useCallback(() => {
    showColumnPicker();
  }, [showColumnPicker]);

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
