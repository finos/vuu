import React, { useState } from "react";

import { Component } from "@finos/vuu-layout";
import { Dialog } from "@finos/vuu-popups";

let displaySequence = 1;

export const SimpleDialog = () => {
  return (
    <Dialog isOpen center={true}>
      <Component
        title="Cornflower"
        style={{ backgroundColor: "cornflowerblue", height: 400, width: 300 }}
      />
    </Dialog>
  );
};
SimpleDialog.displaySequence = displaySequence++;

export const DialogOpenClose = () => {
  const [open, setOpen] = useState(false);
  const openDialog = () => {
    setOpen(true);
  };
  const closeDialog = () => {
    setOpen(false);
  };
  return (
    <div>
      <button onClick={open ? closeDialog : openDialog}>{`${
        open ? "Close" : "Open"
      } Dialog`}</button>
      <Dialog isOpen={open} onClose={closeDialog}>
        <Component
          title="Cornflower"
          style={{ backgroundColor: "cornflowerblue", height: 400, width: 300 }}
        />
      </Dialog>
    </div>
  );
};
DialogOpenClose.displaySequence = displaySequence++;
