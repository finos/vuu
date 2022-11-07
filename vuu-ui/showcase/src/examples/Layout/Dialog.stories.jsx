import React, { useState } from "react";

import { Dialog, Component } from "@vuu-ui/vuu-layout";

export default {
  title: "Layout/Dialog",
  component: Dialog,
};

export const SimpleDialog = () => {
  return (
    <Dialog isOpen>
      <Component
        title="Cornflower"
        style={{ backgroundColor: "cornflowerblue", height: 400, width: 300 }}
      />
    </Dialog>
  );
};

export const DialogOpenClose = () => {
  const [open, setOpen] = useState(false);
  const openDialog = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };
  return (
    <div>
      <button onClick={openDialog}>Open Dialog</button>
      <Dialog isOpen={open} onClose={handleClose}>
        <Component
          title="Cornflower"
          style={{ backgroundColor: "cornflowerblue", height: 400, width: 300 }}
        />
      </Dialog>
    </div>
  );
};
