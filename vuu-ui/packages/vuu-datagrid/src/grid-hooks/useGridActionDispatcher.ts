import { ConfigChangeHandler } from "@vuu-ui/vuu-data";
import { useCallback } from "react";
import {
  DataSourceAction,
  GridAction,
  GridActionSelection,
  GridModelDispatch,
  ScrollAction,
} from "../grid-context";

export interface GridActionHookProps {
  dispatchGridModelAction: GridModelDispatch;
  invokeDataSourceAction: (action: DataSourceAction) => void;
  handleSelectionChange: (action: GridActionSelection) => void;
  invokeScrollAction: (action: ScrollAction) => void;
  onConfigChange: ConfigChangeHandler;
}

export const useGridActionDispatcher = ({
  dispatchGridModelAction,
  invokeDataSourceAction,
  handleSelectionChange,
  invokeScrollAction,
  onConfigChange,
}: GridActionHookProps) => {
  const dispatchAction = useCallback(
    (action: GridAction) => {
      switch (action.type) {
        case "sort":
        case "group":
        case "openTreeNode":
        case "closeTreeNode":
          return invokeDataSourceAction(action), true;
        case "selection":
          return handleSelectionChange(action), true;
        case "scroll-start-horizontal":
        case "scroll-end-horizontal":
          return invokeScrollAction(action), true;
        case "resize-col":
          {
            dispatchGridModelAction(action);
            if (action.phase === "end") {
              onConfigChange?.({ type: "columns" });
            }
          }

          break;

        default:
          return false;
      }
    },
    [
      invokeDataSourceAction,
      handleSelectionChange,
      invokeScrollAction,
      dispatchGridModelAction,
      onConfigChange,
    ]
  );

  return dispatchAction;
};
