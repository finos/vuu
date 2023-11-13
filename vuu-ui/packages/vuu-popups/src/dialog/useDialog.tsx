import { ReactElement, useCallback, useState } from "react";
import { Dialog } from "./Dialog";

export type DialogState = {
  content: ReactElement;
  title: string;
  hideCloseButton?: boolean;
};

export type SetDialog = (dialogState?: DialogState) => void;

export const useDialog = () => {
  const [dialogState, setDialogState] = useState<DialogState>();

  const handleClose = useCallback(() => {
    setDialogState(undefined);
  }, []);

  const dialog = dialogState ? (
    <Dialog
      className="vuDialog"
      isOpen={true}
      onClose={handleClose}
      style={{ maxHeight: 500 }}
      title={dialogState.title}
      hideCloseButton={dialogState.hideCloseButton}
    >
      {dialogState.content}
    </Dialog>
  ) : null;

  return {
    dialog,
    setDialogState,
  };
};
