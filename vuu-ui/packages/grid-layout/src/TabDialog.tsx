import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogHeader,
  FormField,
  FormFieldLabel,
  Input,
} from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import {
  ChangeEvent,
  CSSProperties,
  KeyboardEventHandler,
  RefCallback,
  useCallback,
  useState,
} from "react";

import tabDialogCss from "./TabDialog.css";

export const TabDialog = ({
  open,
  onConfirm,
  onCancel,
  style,
  tabLabel = "",
  title = "Add new tab",
}: {
  open?: boolean;
  onConfirm: (value: string) => void;
  onCancel: () => void;
  style?: CSSProperties;
  tabLabel?: string;
  title?: string;
}) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-tab-dialog",
    css: tabDialogCss,
    window: targetWindow,
  });

  const [value, setValue] = useState(tabLabel);

  const inputCallbackRef = useCallback<RefCallback<HTMLInputElement>>((el) => {
    if (el) {
      el.select();
    }
  }, []);

  const handleKeyDown = useCallback<KeyboardEventHandler<HTMLInputElement>>(
    (evt) => {
      if (evt.key === "Enter" && value !== tabLabel) {
        onConfirm(value);
      }
    },
    [onConfirm, tabLabel, value],
  );

  return (
    <Dialog open={open} className="TabDialog" style={style}>
      <DialogHeader header={title} />
      <DialogContent>
        <div className="TabDialog-content">
          <FormField>
            <FormFieldLabel>New tab name</FormFieldLabel>
            <Input
              inputRef={inputCallbackRef}
              value={value}
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                setValue(event.target.value);
              }}
              inputProps={{
                onKeyDown: handleKeyDown,
              }}
            />
          </FormField>
        </div>
      </DialogContent>
      <DialogActions>
        <Button appearance="solid" sentiment="negative" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          disabled={value.trim() === ""}
          appearance="solid"
          sentiment="accented"
          onClick={() => {
            onConfirm(value);
          }}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};
