import { Flexbox, View } from "@finos/vuu-layout";
import { CSSProperties } from "react";
import { random_1000 } from "../salt/List.data";
import { OverflowContainer } from "./components/overflow-container";

import "./OverflowExperiments.examples.css";

let displaySequence = 1;

export const DefaultWrapOverflowContainer = () => {
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
      <OverflowContainer style={{ width: "100%", height: 44 }}>
        <div className="Item" style={{ width: 100 }}></div>
        <div className="Item" style={{ width: 100 }}></div>
        <div className="Item" style={{ width: 100 }}></div>
        <div className="Item" style={{ width: 100 }}></div>
        <div className="Item" style={{ width: 100 }}></div>
        <div className="Item" style={{ width: 100 }}></div>
      </OverflowContainer>
    </div>
  );
};

DefaultWrapOverflowContainer.displaySequence = displaySequence++;

export const WrapOverflowContainerFlexLayout = () => {
  return (
    <div
      style={
        {
          "--vuuOverflowContainer-background": "white",
          height: "100vh",
          padding: 100,
          width: "100vw",
          background: "ivory",
        } as CSSProperties
      }
    >
      <Flexbox
        style={{
          background: "white",
          border: "solid var(--salt-container-primary-borderColor) 1px",
          flexDirection: "row",
          width: 800,
          height: 300,
        }}
      >
        <Flexbox
          resizeable
          style={{ flex: 1, flexDirection: "column", background: "#ccc" }}
        >
          {/* prettier-ignore */}
          <OverflowContainer  style={{ flex: 0, height: 44 }}>
            <div className="Item" style={{ width: 100 }}>1</div>
            <div className="Item" style={{ width: 100 }}>2</div>
            <div className="Item" style={{ width: 100 }}>3</div>
            <div className="Item" style={{ width: 100 }}>4</div>
            <div className="Item" style={{ width: 100 }}>5</div>
            <div className="Item" style={{ width: 100 }}>6</div>
          </OverflowContainer>
          {/* prettier-ignore */}
          <OverflowContainer  style={{ flex: 0, height: 44, marginTop: 20 }}>
            <div className="Item" style={{ width: 100 }}>1</div>
            <div className="Item" style={{ width: 100 }}>2</div>
            <div className="Item" style={{ width: 100 }}>3</div>
            <div className="Item" style={{ width: 100 }}>4</div>
            <div className="Item" style={{ width: 50 }}>5</div>
            <div className="Item" style={{ width: 50 }}>6</div>
            <div className="Item" style={{ width: 120 }}>7</div>
          </OverflowContainer>
          {/* prettier-ignore */}
          <OverflowContainer  style={{ flex: 0, height: 44, marginTop: 20 }}>
            <div className="Item" style={{ width: 40 }}>1</div>
            <div className="Item" style={{ width: 40 }}>2</div>
            <div className="Item" style={{ width: 40 }}>3</div>
            <div className="Item" style={{ width: 40 }}>4</div>
            <div className="Item" style={{ width: 40 }}>5</div>
            <div className="Item" style={{ width: 40 }}>6</div>
            <div className="Item" style={{ width: 40 }}>7</div>
            <div className="Item" style={{ width: 40 }}>8</div>
            <div className="Item" style={{ width: 40 }}>9</div>
            <div className="Item" style={{ width: 50 }}>10</div>
            <div className="Item" style={{ width: 120 }}>11</div>
          </OverflowContainer>
          <div style={{ backgroundColor: "#ccc", flex: 1 }} />
        </Flexbox>
        <div data-resizeable style={{ background: "ivory", width: 20 }} />
      </Flexbox>
    </div>
  );
};

WrapOverflowContainerFlexLayout.displaySequence = displaySequence++;
