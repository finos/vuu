import { useCallback, useMemo, useState } from "react";
import { TabDialog } from "./TabDialog";
import { ComponentTemplate, useGridLayoutDispatch } from "./GridLayoutContext";

export interface EditTabNameHookProps {
  getNewComponent?: () => ComponentTemplate;
  id: string;
  mode?: "add" | "edit";
  tabLabel?: string;
}

export const useEditTabName = ({
  getNewComponent,
  id,
  mode = "add",
  tabLabel,
}: EditTabNameHookProps) => {
  const [confirmationOpen, setConfirmationOpen] = useState(false);

  const dispatch = useGridLayoutDispatch();

  const handleConfirm = useCallback(
    (title: string) => {
      if (mode === "add") {
        const componentTemplate = getNewComponent?.();
        if (componentTemplate) {
          dispatch({
            title,
            type: "add-tabbed-child",
            componentTemplate,
            stackId: id,
          });
        }
      } else {
        dispatch({ type: "rename-tab", id, title });
      }
      setConfirmationOpen(false);
    },
    [dispatch, getNewComponent, id, mode],
  );

  const handleCancel = useCallback(() => {
    setConfirmationOpen(false);
  }, []);

  const dialog = useMemo(() => {
    const getDialogStyle = () => {
      const tabElement = document.querySelector(
        `.saltTabNext[data-grid-layout-item-id="${id}"]`,
      );
      if (tabElement) {
        const { left, bottom } = tabElement.getBoundingClientRect();
        return { margin: 0, top: bottom + 20, left: Math.max(10, left - 20) };
      } else {
        return undefined;
      }
    };

    return (
      <TabDialog
        open={confirmationOpen}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        style={getDialogStyle()}
        tabLabel={tabLabel}
      />
    );
  }, [confirmationOpen, handleCancel, handleConfirm, id, tabLabel]);

  const showTabEditDialog = () => {
    setConfirmationOpen(true);
  };

  return {
    dialog: confirmationOpen ? dialog : null,
    showTabEditDialog,
  };
};
