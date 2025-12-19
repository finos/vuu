import { Button, DialogActions } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { useCallback, useState } from "react";
import { BulkEditPanel, BulkEditPanelProps } from "./BulkEditPanel";

import bulkEditPanelCss from "./BulkEditPanel.css";

export interface BulkEditDialogProps
  extends Pick<BulkEditPanelProps, "columns" | "parentDs" | "sessionDs"> {
  closeDialog: () => void;
}

export const BulkEditDialog = ({
  columns,
  sessionDs,
  parentDs,
  closeDialog,
}: BulkEditDialogProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-bulk-edit-row",
    css: bulkEditPanelCss,
    window: targetWindow,
  });

  const [valid, setValid] = useState(true);
  const handleValidationStatusChange = useCallback((isValid: boolean) => {
    setValid(isValid);
  }, []);

  const handleSubmit = useCallback(async () => {
    const response = await sessionDs?.rpcRequest?.({
      params: {},
      rpcName: "VP_BULK_EDIT_SUBMIT_RPC",
      type: "RPC_REQUEST",
    });
    if (response?.type === "SUCCESS_RESULT") {
      closeDialog();
    } else if (response?.type === "ERROR_RESULT") {
      // TODO
      console.error({ response });
    }
  }, [closeDialog, sessionDs]);

  return (
    <>
      <BulkEditPanel
        columns={columns}
        sessionDs={sessionDs}
        onSubmit={handleSubmit}
        parentDs={parentDs}
        onValidationStatusChange={handleValidationStatusChange}
      />
      <DialogActions>
        <Button key="cancel" onClick={closeDialog}>
          Cancel
        </Button>
        <Button key="submit" onClick={handleSubmit} disabled={!valid}>
          Save
        </Button>
      </DialogActions>
    </>
  );
};
