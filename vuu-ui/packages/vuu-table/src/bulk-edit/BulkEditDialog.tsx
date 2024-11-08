import { DataSource } from "@finos/vuu-data-types";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { useCallback, useState } from "react";

import bulkEditPanelCss from "./BulkEditPanel.css";
import { BulkEditPanel } from "./BulkEditPanel";
import { Button, DialogActions } from "@salt-ds/core";
import { ColumnDescriptor } from "@finos/vuu-table-types";
import { isRpcSuccess, viewportRpcRequest } from "@finos/vuu-utils";

export interface BulkEditDialogProps {
  columns?: ColumnDescriptor[];
  sessionDs: DataSource;
  parentDs: DataSource;
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
    const response = await sessionDs?.rpcCall?.(
      viewportRpcRequest("VP_BULK_EDIT_SUBMIT_RPC"),
    );
    if (isRpcSuccess(response)) {
      closeDialog();
    } else {
      // TODO
      console.error({ response });
    }
  }, [closeDialog, sessionDs]);

  return (
    <>
      <BulkEditPanel
        columns={columns}
        dataSource={sessionDs}
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
