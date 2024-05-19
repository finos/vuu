import { SaveLayoutPanel } from "@finos/vuu-shell";
import { Dialog, DialogContent, DialogHeader } from "@salt-ds/core";
import { useCallback } from "react";

let displaySequence = 1;

export const SavePanel = () => {
  const handleSave = useCallback((layoutMeta) => {
    console.log(JSON.stringify(layoutMeta, null, 2));
  }, []);

  return (
    <Dialog open style={{ width: "fit-content", borderColor: "#6d188b" }}>
      <DialogHeader header="Save Layout" />
      <DialogContent>
        <SaveLayoutPanel onCancel={() => null} onSave={handleSave} />
      </DialogContent>
    </Dialog>
  );
};
SavePanel.displaySequence = displaySequence++;
