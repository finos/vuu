import { SaveLayoutPanel } from "@vuu-ui/vuu-shell";
import { LayoutMetadataDto } from "@vuu-ui/vuu-utils";
import { Dialog, DialogContent, DialogHeader } from "@salt-ds/core";
import { useCallback } from "react";

export const SavePanel = () => {
  const handleSave = useCallback((layoutMeta: LayoutMetadataDto) => {
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
