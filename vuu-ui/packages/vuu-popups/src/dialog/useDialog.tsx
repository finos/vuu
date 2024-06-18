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
  useMemo,
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
  setDialogDispatchers: (
    showDialog: ShowDialog,
    closeDialog: () => void
  ) => void;
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
        <DialogCloseButton
          data-embedded
          data-icon="close"
          onClick={closeDialog}
        />
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

const defaultShowDialog: ShowDialog = () => {
  console.warn("No DialogProvider in place");
};
const defaultCloseDialog = () => {
  console.warn("No DialogProvider in place");
};

class DialogContextObject implements DialogContextProps {
  showDialog = defaultShowDialog;
  closeDialog = defaultCloseDialog;
  setDialogDispatchers(showDialog: ShowDialog, closeDialog: () => void) {
    this.showDialog = showDialog;
    this.closeDialog = closeDialog;
  }
}

const DialogContext = createContext<DialogContextProps>(
  new DialogContextObject()
);

const DialogHost = ({ context }: { context: DialogContextProps }) => {
  const { dialog, setDialogState } = useDialog();
  const showDialog: ShowDialog = useCallback(
    (dialogContent, title, actionButtons) => {
      console.log("show dialog");
      setDialogState({
        actions: actionButtons,
        content: dialogContent,
        title,
      });
    },
    [setDialogState]
  );
  const closeDialog = useCallback(() => {
    setDialogState(undefined);
  }, [setDialogState]);

  useMemo(() => {
    context.setDialogDispatchers(showDialog, closeDialog);
  }, [closeDialog, context, showDialog]);
  return dialog;
};

export const DialogProvider = ({ children }: { children: ReactNode }) => {
  const context = useContext(DialogContext);
  return (
    <DialogContext.Provider value={context}>
      <DialogHost context={context} />
      {children}
    </DialogContext.Provider>
  );
};

export const useDialogContext = () => {
  const { closeDialog, showDialog } = useContext(DialogContext);
  return { showDialog, closeDialog };
};
