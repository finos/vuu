import { ModalProvider, useModal } from "@vuu-ui/vuu-ui-controls";
import { Button } from "@salt-ds/core";
import { MouseEventHandler, useCallback, useRef, useState } from "react";

const ComponentThatShowsModals = () => {
  const renderCountRef = useRef(0);
  const [, forceRefresh] = useState({});
  const { showDialog, showPrompt } = useModal();

  renderCountRef.current += 1;

  const handleClickDialog = useCallback(() => {
    showDialog(
      <div style={{ width: 200, height: 130, background: "cornflowerblue" }} />,
      "A Dialog",
    );
  }, [showDialog]);

  const handleClickPrompt = useCallback<MouseEventHandler>(
    (e) => {
      e.stopPropagation();
      showPrompt(<div style={{ height: 130, background: "navy" }} />, {
        title: "A Prompt",
      });
    },
    [showPrompt],
  );

  const buttonClick = useCallback<MouseEventHandler>((e) => {
    e.stopPropagation();
    forceRefresh({});
  }, []);

  return (
    <div
      data-testid="dialog-trigger"
      style={{
        position: "relative",
        width: 700,
        height: 500,
        background: "yellow",
      }}
      onClick={handleClickDialog}
    >
      <div style={{ padding: 12 }}>
        <p>Click the button to force a render.</p>
        <p>Click yellow area to show a Dialog</p>
        <p>Click gray area to show a Prompt</p>
        <p>Show Dialog should not trigger render</p>

        <Button
          onClick={buttonClick}
        >{`rendered ${renderCountRef.current} times`}</Button>
      </div>

      <div
        data-testid="prompt-trigger"
        onClick={handleClickPrompt}
        style={{
          background: "lightgray",
          bottom: 0,
          position: "absolute",
          height: 200,
          left: 0,
          right: 0,
        }}
      ></div>
    </div>
  );
};

export const DefaultModalProvider = () => (
  <ModalProvider>
    <ComponentThatShowsModals />
  </ModalProvider>
);
