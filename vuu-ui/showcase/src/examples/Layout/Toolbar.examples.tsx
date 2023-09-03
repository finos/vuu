import { Toolbar } from "@finos/vuu-layout";
import { Button } from "@salt-ds/core";
import { CSSProperties, MouseEvent, useCallback } from "react";

import "./Toolbar.examples.css";

let displaySequence = 1;

export const DefaulToolbar = () => {
  return (
    <div
      style={
        {
          height: "100vh",
          padding: 100,
          width: "100vw",
          background: "ivory",
          "--vuuPopupMenu-background": "red",
        } as CSSProperties
      }
    >
      <Toolbar
        height={44}
        style={{
          background: "var(--vuu-color-gray-30)",
          width: "100%",
          height: 44,
        }}
      >
        <div tabIndex={0} className="Item" style={{ width: 100 }}></div>
        <div tabIndex={0} className="Item" style={{ width: 100 }}></div>
        <div tabIndex={0} className="Item" style={{ width: 100 }}></div>
        <div tabIndex={0} className="Item" style={{ width: 100 }}></div>
        <div tabIndex={0} className="Item" style={{ width: 100 }}></div>
        <div tabIndex={0} className="Item" style={{ width: 100 }}></div>
      </Toolbar>
    </div>
  );
};

DefaulToolbar.displaySequence = displaySequence++;

export const ToolbarItemsEventHandlers = () => {
  const handleClick = useCallback((evt: MouseEvent<HTMLButtonElement>) => {
    const { dataset } = evt.target as HTMLButtonElement;
    console.log(`clicked button ${dataset.index}`);
  }, []);
  return (
    <div
      style={
        {
          height: "100vh",
          padding: 100,
          width: "100vw",
          background: "ivory",
          "--vuuPopupMenu-background": "red",
        } as CSSProperties
      }
    >
      <Toolbar
        height={44}
        style={{
          background: "var(--vuu-color-gray-30)",
          width: "100%",
          height: 44,
        }}
      >
        <Button
          className="Item"
          data-index={0}
          onClick={handleClick}
          style={{ width: 100 }}
        >
          Button 1
        </Button>
        <Button
          className="Item"
          data-index={1}
          onClick={handleClick}
          style={{ width: 100 }}
        >
          Button 2
        </Button>
        <Button
          className="Item"
          data-index={2}
          onClick={handleClick}
          style={{ width: 100 }}
        >
          Button 3
        </Button>
        <Button
          className="Item"
          data-index={3}
          onClick={handleClick}
          style={{ width: 100 }}
        >
          Button 4
        </Button>
        <Button
          className="Item"
          data-index={4}
          onClick={handleClick}
          style={{ width: 100 }}
        >
          Button 5
        </Button>
        <Button
          className="Item"
          data-index={5}
          onClick={handleClick}
          style={{ width: 100 }}
        >
          Button 6
        </Button>
      </Toolbar>
    </div>
  );
};

ToolbarItemsEventHandlers.displaySequence = displaySequence++;
