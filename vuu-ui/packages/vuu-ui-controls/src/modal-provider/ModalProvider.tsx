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
import { Prompt, PromptProps } from "../prompt/Prompt";

export type ShowDialog = (
  dialogContent: ReactElement,
  title: string,
  dialogActionButtons?: ReactElement[],
  hideCloseButton?: boolean,
) => void;

export type ShowPrompt = (
  promptContent: ReactElement,
  promptProps: PromptProps,
) => void;

type DialogState = {
  actions?: ReactElement[];
  content: ReactElement;
  title: string;
  hideCloseButton?: boolean;
};

type PromptState = {
  content: ReactElement;
  promptProps: PromptProps;
};

type SetDispatchers = (
  showDialog: ShowDialog,
  closeDialog: () => void,
  showPrompt: ShowPrompt,
  closePrompt: () => void,
) => void;

interface DialogContextProps {
  closeDialog: () => void;
  closePrompt: () => void;
  showDialog: ShowDialog;
  showPrompt: ShowPrompt;
  setDispatchers: SetDispatchers;
}

const useDialogHost = () => {
  const [dialogState, setDialogState] = useState<DialogState>();
  const [promptState, setPromptState] = useState<PromptState>();

  const closePrompt = useCallback(() => {
    setPromptState(undefined);
  }, []);

  const closeDialog = useCallback(() => {
    setDialogState(undefined);
  }, []);

  const handleOpenChange = useCallback(
    (open?: boolean) => {
      if (open !== true) {
        closeDialog();
      }
    },
    [closeDialog],
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

  const handleOpenChangePrompt = useCallback(
    (open: boolean) => {
      if (open !== true) {
        closePrompt();
      }
      promptState?.promptProps.onOpenChange?.(open);
    },
    [closePrompt, promptState],
  );

  const prompt = promptState ? (
    <Prompt
      {...promptState.promptProps}
      onClose={closePrompt}
      onOpenChange={handleOpenChangePrompt}
      open
    >
      {promptState.content}
    </Prompt>
  ) : null;

  return {
    dialog,
    prompt,
    setDialogState,
    setPromptState,
  };
};

const defaultShowDialog: ShowDialog = () => {
  console.warn("No DialogProvider in place");
};
const defaultCloseDialog = () => {
  console.warn("No DialogProvider in place");
};
const defaultShowPrompt: ShowPrompt = () => {
  console.warn("No DialogProvider in place");
};
const defaultClosePrompt = () => {
  console.warn("No DialogProvider in place");
};

class DialogContextObject implements DialogContextProps {
  showDialog = defaultShowDialog;
  closeDialog = defaultCloseDialog;
  showPrompt = defaultShowPrompt;
  closePrompt = defaultClosePrompt;
  setDispatchers: SetDispatchers = (
    showDialog,
    closeDialog,
    showPrompt,
    closePrompt,
  ) => {
    this.showDialog = showDialog;
    this.closeDialog = closeDialog;
    this.showPrompt = showPrompt;
    this.closePrompt = closePrompt;
  };
}

const DialogContext = createContext<DialogContextProps>(
  new DialogContextObject(),
);

const DialogHost = ({ context }: { context: DialogContextProps }) => {
  const { dialog, setDialogState, prompt, setPromptState } = useDialogHost();
  const showDialog: ShowDialog = useCallback(
    (dialogContent, title, actionButtons, hideCloseButton) => {
      setDialogState({
        actions: actionButtons,
        content: dialogContent,
        title,
        hideCloseButton,
      });
    },
    [setDialogState],
  );
  const closeDialog = useCallback(() => {
    setDialogState(undefined);
  }, [setDialogState]);

  const showPrompt: ShowPrompt = useCallback(
    (content, promptProps) => {
      setPromptState({
        content,
        promptProps,
      });
    },
    [setPromptState],
  );
  const closePrompt = useCallback(() => {
    setPromptState(undefined);
  }, [setPromptState]);

  useMemo(() => {
    context.setDispatchers(showDialog, closeDialog, showPrompt, closePrompt);
  }, [closeDialog, closePrompt, context, showDialog, showPrompt]);
  return dialog ?? prompt;
};

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const context = useContext(DialogContext);
  return (
    <DialogContext.Provider value={context}>
      <DialogHost context={context} />
      {children}
    </DialogContext.Provider>
  );
};

export const useModal = () => {
  const { closeDialog, closePrompt, showDialog, showPrompt } =
    useContext(DialogContext);
  return { showDialog, closeDialog, showPrompt, closePrompt };
};
