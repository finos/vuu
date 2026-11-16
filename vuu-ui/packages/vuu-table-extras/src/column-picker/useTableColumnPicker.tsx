import { useContextPanel, useHideContextPanel } from "@vuu-ui/vuu-ui-controls";
import { useCallback, useEffect, useRef } from "react";
import { ColumnPicker } from "./ColumnPicker";
import { ColumnModel } from "./ColumnModel";
import type { ColumnSetModel } from "../column-sets/ColumnSetModel";

export interface TableColumnPickerHookProps {
  columnModel: ColumnModel;
  columnSetModel?: ColumnSetModel;
}

export const useTableColumnPicker = ({
  columnModel,
  columnSetModel,
}: TableColumnPickerHookProps) => {
  const showContextPanel = useContextPanel();
  const hideContextPanel = useHideContextPanel();
  const contextPanelShowing = useRef(false);

  const showColumnPicker = useCallback(
    (title = "Column Picker") => {
      contextPanelShowing.current = true;
      showContextPanel(
        <ColumnPicker
          columnModel={columnModel}
          columnSetModel={columnSetModel}
        />,
        title,
      );
    },
    [columnModel, columnSetModel, showContextPanel],
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
