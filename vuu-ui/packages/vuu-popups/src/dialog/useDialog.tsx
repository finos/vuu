import {
  Dialog,
  DialogActions,
  DialogCloseButton,
  DialogContent,
  DialogHeader,
} from "@salt-ds/core";
import {
  createContext,
  ReactElement,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

export type DialogState = {
  actions?: ReactElement[];
  content: ReactElement;
  title: string;
  hideCloseButton?: boolean;
};

export type SetDialog = (dialogState?: DialogState) => void;

export type ShowDialog = (
  dialogContent: ReactElement,
  title: string,
  dialogActionButtons?: ReactElement[]
) => void;

export interface DialogContextProps {
  showDialog: ShowDialog;
  closeDialog: () => void;
}

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
    <Dialog open={true} onOpenChange={handleOpenChange}>
      <DialogHeader header={dialogState.title} />
      <DialogContent>{dialogState.content}</DialogContent>
      {dialogState.hideCloseButton !== true ? (
        <DialogCloseButton onClick={closeDialog} />
      ) : null}
      {dialogState.actions ? (
        <DialogActions>{dialogState.actions}</DialogActions>
      ) : null}
    </Dialog>
  ) : null;

  return {
    dialog,
    setDialogState,
  };
};

const defaultShowDialog = () => {
  console.warn("No DialogProvider in place");
};
const defaultCloseDialog = () => {
  console.warn("No DialogProvider in place");
};

const DialogContext = createContext<DialogContextProps>({
  showDialog: defaultShowDialog,
  closeDialog: defaultCloseDialog,
});

export const DialogProvider = ({ children }: { children: ReactNode }) => {
  const { dialog, setDialogState } = useDialog();
  const showDialog: ShowDialog = (dialogContent, title, actionButtons) => {
    setDialogState({
      actions: actionButtons,
      content: dialogContent,
      title,
    });
  };
  const closeDialog = () => {
    setDialogState(undefined);
  };
  return (
    <DialogContext.Provider value={{ showDialog, closeDialog }}>
      {children}
      {dialog}
    </DialogContext.Provider>
  );
};

export const useDialogContext = () => {
  const { showDialog } = useContext(DialogContext);
  const { closeDialog } = useContext(DialogContext);
  return { showDialog, closeDialog };
};
