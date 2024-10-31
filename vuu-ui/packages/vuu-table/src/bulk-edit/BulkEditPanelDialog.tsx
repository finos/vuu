import { DataSource } from "@finos/vuu-data-types";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { HTMLAttributes, useCallback, useState } from "react";

import bulkEditPanelCss from "./BulkEditPanel.css";
import { BulkEditPanel } from "./BulkEditPanel";
import { Button, DialogActions } from "@salt-ds/core";
import { ColumnDescriptor } from "@finos/vuu-table-types";
import { viewportRpcRequest } from "@finos/vuu-utils";

export interface BulkEditPanelDialogProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  columns?: ColumnDescriptor[];
  sessionDs: DataSource;
  parentDs: DataSource;
  closeDialog: () => void;
}

export const BulkEditPanelDialog = ({
  columns,
  sessionDs,
  parentDs,
  closeDialog,
  //   ...htmlAttributes
}: BulkEditPanelDialogProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-bulk-edit-row",
    css: bulkEditPanelCss,
    window: targetWindow,
  });

  const [valid, setValid] = useState(true);
  const handleChange = useCallback((isValid: boolean) => {
    //   console.log("setting to: ", isValid);
    setValid(isValid);
    //   console.log("current valid value: ", valid);
  }, []);

  const handleSubmit = () => {
    sessionDs?.rpcCall?.(viewportRpcRequest("VP_BULK_EDIT_SUBMIT_RPC"));
    closeDialog();
  };

  return (
    <>
      <BulkEditPanel
        columns={columns}
        dataSource={sessionDs}
        onSubmit={handleSubmit}
        parentDs={parentDs}
        handleChange={handleChange}
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
