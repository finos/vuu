import { Flexbox } from "@vuu-ui/vuu-layout";
import { OverflowContainer } from "@vuu-ui/vuu-ui-controls";
import { CSSProperties, useCallback, useState } from "react";

import "./OverflowContainer.examples.css";

export const DefaultOverflowContainer = () => {
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
      <OverflowContainer style={{ width: "100%" }}>
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
          <OverflowContainer style={{ flex: "0, 0, auto"}}>
            <div className="Item" style={{ width: 100 }}>1</div>
            <div className="Item" style={{ width: 100 }}>2</div>
            <div className="Item" style={{ width: 100 }}>3</div>
            <div className="Item" style={{ width: 100 }}>4</div>
            <div className="Item" style={{ width: 100 }}>5</div>
            <div className="Item" style={{ width: 100 }}>6</div>
          </OverflowContainer>
          {/* prettier-ignore */}
          <OverflowContainer style={{ flex: "0, 0, auto", marginTop: 20 }}>
            <div className="Item" style={{ width: 100 }}>1</div>
            <div className="Item" style={{ width: 100 }}>2</div>
            <div className="Item" style={{ width: 100 }}>3</div>
            <div className="Item" style={{ width: 100 }}>4</div>
            <div className="Item" style={{ width: 50 }}>5</div>
            <div className="Item" style={{ width: 50 }}>6</div>
            <div className="Item" style={{ width: 120 }}>7</div>
          </OverflowContainer>
          {/* prettier-ignore */}
          <OverflowContainer style={{ flex: "0, 0, auto", marginTop: 20 }}>
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

export const OverflowContainerHighPriorityItem = () => {
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
          <OverflowContainer style={{ flex: 0}}>
            <div className="Item" style={{ width: 100 }}>1</div>
            <div className="Item" style={{ width: 100 }}>2</div>
            <div className="Item" style={{ width: 100 }}>3</div>
            <div className="Item" style={{ width: 100 }}>4</div>
            <div className="Item" style={{ width: 100 }}>5</div>
            <div className="Item" style={{ width: 28 }} data-overflow-priority="1">6</div>
          </OverflowContainer>
          {/* prettier-ignore */}
          <OverflowContainer style={{ flex: 0, marginTop: 20 }}>
            <div className="Item" style={{ width: 100 }}>1</div>
            <div className="Item" style={{ width: 100 }}>2</div>
            <div className="Item" style={{ width: 100 }}>3</div>
            <div className="Item" style={{ width: 100 }}>4</div>
            <div className="Item" style={{ width: 100 }}>5</div>
            <div className="Item" style={{ width: 100 }} data-overflow-priority="1">6</div>
          </OverflowContainer>
          {/* prettier-ignore */}
          <OverflowContainer style={{ flex: 0,  marginTop: 20 }}>
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
            <div className="Item" style={{ width: 120 }} data-overflow-priority="1">11</div>
          </OverflowContainer>
          {/* prettier-ignore */}
          <OverflowContainer style={{ flex: 0,  marginTop: 20 }}>
            <div className="Item" style={{ width: 40 }}>1</div>
            <div className="Item" style={{ width: 40 }}>2</div>
            <div className="Item" style={{ width: 40 }}>3</div>
            <div className="Item" style={{ width: 40 }}>4</div>
            <div className="Item" style={{ width: 40 }}>5</div>
            <div className="Item" style={{ width: 40 }} data-overflow-priority="1">6</div>
            <div className="Item" style={{ width: 40 }}>7</div>
            <div className="Item" style={{ width: 40 }}>8</div>
            <div className="Item" style={{ width: 40 }}>9</div>
            <div className="Item" style={{ width: 50 }}>10</div>
            <div className="Item" style={{ width: 120 }} >11</div>
          </OverflowContainer>

          <div style={{ backgroundColor: "#ccc", flex: 1 }} />
        </Flexbox>
        <div data-resizeable style={{ background: "ivory", width: 20 }} />
      </Flexbox>
    </div>
  );
};

export const TestFixtureSimpleOverflowContainer = ({ width = 600 }) => {
  return (
    <>
      <input data-testid="input-1" />
      <OverflowContainer data-testid="overflow-container" style={{ width }}>
        <div className="Item" style={{ width: 100 }}></div>
        <div className="Item" style={{ width: 100 }}></div>
        <div className="Item" style={{ width: 100 }}></div>
        <div className="Item" style={{ width: 100 }}></div>
        <div className="Item" style={{ width: 100 }}></div>
        <div className="Item" style={{ width: 100 }}></div>
      </OverflowContainer>
      <input data-testid="input-2" />
    </>
  );
};

export const SortableOverflowContainer = () => {
  const [items, setItems] = useState<string[]>(["1", "2", "3", "4", "5", "6"]);

  const handleDrop = useCallback((fromIndex: number, toIndex: number) => {
    console.log(`handle drop from ${fromIndex} to ${toIndex}`);
    setItems((tabs) => {
      const newTabs = tabs.slice();
      const [tab] = newTabs.splice(fromIndex, 1);
      if (toIndex === -1) {
        return newTabs.concat(tab);
      } else {
        newTabs.splice(toIndex, 0, tab);
        return newTabs;
      }
    });
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
          "--vuuOverflowContainer-background": "white",
        } as CSSProperties
      }
    >
      <OverflowContainer
        allowDragDrop
        onMoveItem={handleDrop}
        style={{ width: "100%" }}
      >
        {items.map((item) => (
          <div className="Item" key={item} style={{ width: 100 }}>
            {item}
          </div>
        ))}
      </OverflowContainer>
    </div>
  );
};

export const VerticalOverflowContainerFlexLayout = () => {
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
          flexDirection: "column",
          width: 400,
          height: 800,
        }}
      >
        <div
          data-resizeable
          style={{ background: "lightcyan", flex: 1, overflow: "hidden" }}
        >
          {/* prettier-ignore */}
          <OverflowContainer orientation="vertical">
              <div className="Item" style={{ height: 60 }}>1</div>
              <div className="Item" style={{ height: 60 }}>2</div>
              <div className="Item" style={{ height: 60 }}>3</div>
              <div className="Item" style={{ height: 60 }}>4</div>
              <div className="Item" style={{ height: 60 }}>5</div>
              <div className="Item" style={{ height: 60 }}>6</div>
            </OverflowContainer>
        </div>
        <div
          data-resizeable
          style={{
            background: "palegreen",
            flexBasis: 200,
            flexGrow: 0,
            flexShrink: 0,
          }}
        />
      </Flexbox>
    </div>
  );
};
