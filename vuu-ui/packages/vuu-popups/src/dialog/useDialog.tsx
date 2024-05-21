import {
  Dialog,
  DialogCloseButton,
  DialogContent,
  DialogHeader,
} from "@salt-ds/core";
import { ReactElement, useCallback, useState } from "react";

export type DialogState = {
  content: ReactElement;
  title: string;
  hideCloseButton?: boolean;
};

export type SetDialog = (dialogState?: DialogState) => void;

export const useDialog = () => {
  const [dialogState, setDialogState] = useState<DialogState>();

  const closeDialog = useCallback(() => {
    setDialogState(undefined);
  }, []);

  const handleOpenChange = useCallback(
    (open?: boolean) => {
      if (open !== true) {
        closeDialog();
      }
    },
    [closeDialog]
  );

  const dialog = dialogState ? (
    <Dialog className="vuDialog" open={true} onOpenChange={handleOpenChange}>
      <DialogHeader header={dialogState.title} />
      <DialogContent>{dialogState.content}</DialogContent>
      {dialogState.hideCloseButton !== true ? (
        <DialogCloseButton onClick={closeDialog} />
      ) : null}
    </Dialog>
  ) : null;

  return {
    dialog,
    setDialogState,
  };
};
