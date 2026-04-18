import { useContextPanel, useHideContextPanel } from "@vuu-ui/vuu-ui-controls";
import { useCallback, useEffect, useRef } from "react";
import { ColumnPicker } from "./ColumnPicker";
import { ColumnModel } from "./ColumnModel";

export interface TableColumnPickerHookProps {
  columnModel: ColumnModel;
}

export const useTableColumnPicker = ({
  columnModel,
}: TableColumnPickerHookProps) => {
  const showContextPanel = useContextPanel();
  const hideContextPanel = useHideContextPanel();
  const contextPanelShowing = useRef(false);

  const showColumnPicker = useCallback(
    (title = "Column Picker") => {
      contextPanelShowing.current = true;
      showContextPanel(<ColumnPicker columnModel={columnModel} />, title);
    },
    [columnModel, showContextPanel],
  );

  // TODO what's this for ?
  useEffect(
    () => () => {
      if (contextPanelShowing.current) {
        // It might already be closed, but this won't do any harm
        hideContextPanel?.();
      }
    },
    [hideContextPanel],
  );

  return {
    showColumnPicker,
  };
};
