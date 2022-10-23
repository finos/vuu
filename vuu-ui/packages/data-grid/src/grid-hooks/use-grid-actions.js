import { useCallback } from "react";
import * as Action from "../context-menu/context-menu-actions";

export const useGridActions = ({
  dispatchGridModelAction,
  invokeDataSourceAction,
  handleSelectionChange,
  invokeScrollAction,
  onConfigChange,
}) => {
  const dispatchAction = useCallback(
    (action) => {
      switch (action.type) {
        case Action.Sort:
        case "group":
        case "openTreeNode":
        case "closeTreeNode":
          return invokeDataSourceAction(action), true;
        case "selection":
        case "deselection":
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
          console.log(
            `useGridAction, no built-in handler for ${action.type}. Action will be delegated to Application provided context, if available`
          );
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
