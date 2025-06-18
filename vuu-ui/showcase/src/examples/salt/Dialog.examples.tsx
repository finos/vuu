import {
  FC,
  PropsWithChildren,
  ReactElement,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Button,
  StackLayout,
  Dialog,
  DialogHeader,
  DialogActions,
  DialogContent,
  DialogCloseButton,
  DialogProps,
} from "@salt-ds/core";

import "./Dialog.examples.css";

const UnmountLogger = () => {
  useEffect(() => {
    return () => {
      console.log(new Date().getTime(), "Dummy unmount");
    };
  }, []);
  return null;
};

const DialogTemplate: FC<
  Omit<DialogProps, "content"> & {
    header?: string;
    preheader?: string;
    content?: ReactElement;
  }
> = ({
  header,
  preheader,
  content,
  id,
  size,
  open: openProp = false,
  ...args
}) => {
  const [open, setOpen] = useState(openProp);

  const handleRequestOpen = () => {
    setOpen(true);
  };

  const onOpenChange = (value: boolean) => {
    setOpen(value);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Button data-testid="dialog-button" onClick={handleRequestOpen}>
        Open dialog
      </Button>
      <Dialog
        {...args}
        open={open}
        onOpenChange={onOpenChange}
        id={id}
        size={size}
      >
        <DialogHeader header={header} preheader={preheader} />
        <DialogContent>
          {content}
          <UnmountLogger />
        </DialogContent>
        <DialogActions>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleClose}>Previous</Button>
          <Button variant="cta" onClick={handleClose}>
            Next
          </Button>
        </DialogActions>
        <DialogCloseButton onClick={handleClose} />
      </Dialog>
    </>
  );
};

export const DefaultDialog = () => <DialogTemplate id="Default" />;

export const LongContent = () => {
  const content = useMemo(
    () => (
      <StackLayout>
        <div>
          Lorem Ipsum is simply dummy text of the printing and typesetting
          industry. Lorem Ipsum has been the industry's standard dummy text ever
          since the 1500s, when an unknown printer took a galley of type and
          scrambled it to make a type specimen book.
        </div>
        <div>
          It has survived not only five centuries, but also the leap into
          electronic typesetting, remaining essentially unchanged. It was
          popularised in the 1960s with the release of Letraset sheets
          containing Lorem Ipsum passages, and more recently with desktop
          publishing software like Aldus PageMaker including versions of Lorem
          Ipsum.
        </div>
        <div>
          It is a long established fact that a reader will be distracted by the
          readable content of a page when looking at its layout. The point of
          using Lorem Ipsum is that it has a more-or-less normal distribution of
          letters, as opposed to using 'Content here, content here', making it
          look like readable English.
        </div>
        <div>
          Many desktop publishing packages and web page editors now use Lorem
          Ipsum as their default model text, and a search for 'lorem ipsum' will
          uncover many web sites still in their infancy. Various versions have
          evolved over the years, sometimes by accident, sometimes on purpose
          (injected humour and the like).
        </div>
        <div>
          Contrary to popular belief, Lorem Ipsum is not simply random text. It
          has roots in a piece of classical Latin literature from 45 BC, making
          it over 2000 years old. Richard McClintock, a Latin professor at
          Hampden-Sydney College in Virginia, looked up one of the more obscure
          Latin words, consectetur, from a Lorem Ipsum passage, and going
          through the cites of the word in classical literature, discovered the
          undoubtable source.
        </div>
        <div>
          Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de Finibus
          Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero, written
          in 45 BC. This book is a treatise on the theory of ethics, very
          popular during the Renaissance. The first line of Lorem Ipsum, "Lorem
          ipsum dolor sit amet..", comes from a line in section 1.10.32.
        </div>
      </StackLayout>
    ),
    [],
  );

  return (
    <DialogTemplate
      content={content}
      header="Congratulations! You have created a Dialog."
    />
  );
};

export const Preheader = () => (
  <DialogTemplate
    header="Congratulations! You have created a Dialog."
    preheader="I am a preheader"
  />
);

const AlertDialogTemplate: FC<
  Omit<DialogProps, "content"> & { header: string; content?: ReactNode }
> = ({
  open: openProp = false,
  status,
  header,
  size = "small",
  content,
  ...args
}) => {
  const [open, setOpen] = useState(openProp);

  const handleRequestOpen = () => {
    setOpen(true);
  };

  const onOpenChange = (value: boolean) => {
    setOpen(value);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Button data-testid="dialog-button" onClick={handleRequestOpen}>
        Click to open dialog
      </Button>
      <Dialog
        size={size}
        {...args}
        role="alertdialog"
        status={status}
        open={open}
        onOpenChange={onOpenChange}
        // focus the ok instead of the cancel button
        initialFocus={1}
      >
        <DialogHeader header={header} />
        <DialogContent>{content}</DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="cta" onClick={handleClose}>
            Ok
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export const InfoStatus = () => (
  <AlertDialogTemplate status="info" header="Info" />
);

export const SuccessStatus = () => (
  <AlertDialogTemplate status="success" header="Success" />
);

export const Warningtatus = () => (
  <AlertDialogTemplate status="warning" header="Warning" />
);

export const ErrorStatus = () => (
  <AlertDialogTemplate status="error" header="Error" />
);

export const MandatoryAction = ({ open: openProp = false }: DialogProps) => {
  const [open, setOpen] = useState(openProp);

  const handleRequestOpen = () => {
    setOpen(true);
  };

  const onOpenChange = (value: boolean) => {
    setOpen(value);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Button data-testid="dialog-button" onClick={handleRequestOpen}>
        Click to open dialog
      </Button>
      <Dialog
        size="small"
        status="error"
        aria-labelledby="mandatory-action"
        role="alertdialog"
        open={open}
        onOpenChange={onOpenChange}
        initialFocus={1}
        disableDismiss
      >
        <DialogHeader id="mandatory-action" header="Delete Transaction" />

        <DialogContent>
          Are you sure you want to permanently delete this transaction
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="cta" onClick={handleClose}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

function FakeWindow({ children }: PropsWithChildren<unknown>) {
  return (
    <div className="fakeDialogWindow">
      <div className="fakeDialogWindowHeader"></div>
      {children}
    </div>
  );
}

export const DesktopDialog = () => {
  return (
    <StackLayout>
      <FakeWindow>
        <DialogHeader header="Window Dialog" />
        <DialogContent>Hello world!</DialogContent>
        <DialogActions>
          <Button>Cancel</Button>
          <Button variant="cta">Save</Button>
        </DialogActions>
      </FakeWindow>

      <FakeWindow>
        <DialogHeader header="Window Dialog" />
        <DialogContent>Accent world!</DialogContent>
        <DialogActions>
          <Button>Cancel</Button>
          <Button variant="cta">Save</Button>
        </DialogActions>
      </FakeWindow>

      <FakeWindow>
        <DialogHeader status="warning" header="Warning Dialog" />
        <DialogContent>Potential issues abound!</DialogContent>
        <DialogActions>
          <Button>Cancel</Button>
          <Button variant="cta">Ok</Button>
        </DialogActions>
      </FakeWindow>
    </StackLayout>
  );
};
