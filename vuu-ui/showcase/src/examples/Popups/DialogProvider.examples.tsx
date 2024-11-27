import { DialogProvider } from "@finos/vuu-popups";
import { useDialogContext } from "@finos/vuu-popups";
import { Button } from "@salt-ds/core";
import { MouseEventHandler, useCallback, useRef, useState } from "react";

const ComponentThatShowsDialog = () => {
  const renderCountRef = useRef(0);
  const [, forceRefresh] = useState({});
  const { showDialog } = useDialogContext();

  renderCountRef.current += 1;

  const handleClick = useCallback(() => {
    showDialog(
      <div style={{ width: 200, height: 130, background: "cornflowerblue" }} />,
      "A Dialog",
    );
  }, [showDialog]);

  const buttonClick = useCallback<MouseEventHandler>((e) => {
    e.stopPropagation();
    forceRefresh({});
  }, []);

  return (
    <div
      style={{ width: 700, height: 500, background: "yellow" }}
      onClick={handleClick}
    >
      <p>Click the button to force a render.</p>
      <p>Click yellow div to show a Dialog</p>
      <p>Show Dialog should not trigger render</p>

      <Button
        onClick={buttonClick}
      >{`rendered ${renderCountRef.current} times`}</Button>
    </div>
  );
};

export const DefaultDialogProvider = () => (
  <DialogProvider>
    <ComponentThatShowsDialog />
  </DialogProvider>
);
