import { useCallback, useContext } from "react";
import { ContextMenuContext } from "./ContextMenuProvider";

/**
 * Returns a function that closes the context menu currently shown by the
 * nearest ContextMenuProvider, if any.
 */
export const useHideContextMenu = () => {
  const ctx = useContext(ContextMenuContext);
  return useCallback(() => ctx?.showContextMenu(null), [ctx]);
};
