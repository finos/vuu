import { SaveLayoutPanel } from "@finos/vuu-shell";
import { Dialog } from "@finos/vuu-popups";

export const SavePanel = () => {
  return (
  <Dialog
    isOpen
    style={{ maxHeight: 500, borderColor: "#6d188b" }}
    title={"Save Layout"}
    hideCloseButton
  >
    <SaveLayoutPanel onCancel={() => { }} onSave={() => { }} />
  </Dialog>
  );
};
