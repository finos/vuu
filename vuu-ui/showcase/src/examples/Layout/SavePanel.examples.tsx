import { SaveLayoutPanel } from "@finos/vuu-shell";
import { Dialog } from "@finos/vuu-popups";
import { useCallback } from "react";

let displaySequence = 1;

export const SavePanel = () => {
  const handleSave = useCallback((layoutMeta) => {
    console.log(JSON.stringify(layoutMeta, null, 2));
  }, []);

  return (
    <Dialog
      isOpen
      style={{ maxHeight: 500, borderColor: "#6d188b" }}
      title={"Save Layout"}
      hideCloseButton
    >
      <SaveLayoutPanel onCancel={() => {}} onSave={handleSave} />
    </Dialog>
  );
};
SavePanel.displaySequence = displaySequence++;
