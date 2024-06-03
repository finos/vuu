import {
  Dialog,
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
  content: ReactElement;
  title: string;
  hideCloseButton?: boolean;
};

export type SetDialog = (dialogState?: DialogState) => void;

export interface DialogContextProps {
  showDialog: (dialogContent: ReactElement, title: string) => void;
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

const DialogContext = createContext<DialogContextProps>({
  showDialog: defaultShowDialog,
});

export const DialogProvider = ({ children }: { children: ReactNode }) => {
  const { dialog, setDialogState } = useDialog();
  const showDialog = (dialogContent: ReactElement, title: string) => {
    setDialogState({
      content: dialogContent,
      title,
    });
  };
  return (
    <DialogContext.Provider value={{ showDialog }}>
      {children}
      {dialog}
    </DialogContext.Provider>
  );
};

export const useShowDialog = () => {
  const { showDialog } = useContext(DialogContext);
  return showDialog;
};
