import {
  DraggableLayout,
  Flexbox,
  LayoutChangeHandler,
  LayoutProvider,
} from "@finos/vuu-layout";
import { LayoutJSON } from "@finos/vuu-utils";
import { Button } from "@salt-ds/core";
import { useCallback, useState } from "react";

let displaySequence = 1;

const contentRed = {
  type: "div",
  props: {
    style: { backgroundColor: "red", height: "100%" },
  },
};
const contentYellow = {
  type: "div",
  props: {
    style: { backgroundColor: "yellow", height: "100%" },
  },
};
const contentBlue = {
  type: "div",
  props: {
    style: { backgroundColor: "blue", height: "100%" },
  },
};

export const StaticTemplateNoChrome = () => {
  const handleLayoutChange = useCallback<LayoutChangeHandler>((layout) => {
    console.log({ layout });
  }, []);

  const [layout, setLayout] = useState<LayoutJSON>();
  const showRedContent = () => setLayout(contentRed);
  const showYellowContent = () => setLayout(contentYellow);
  const showBlueContent = () => setLayout(contentBlue);

  return (
    <>
      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: "var(--salt-spacing-100)",
          height: 60,
          padding: "0 var(--salt-spacing-100)",
        }}
      >
        <Button onClick={showRedContent}>Red content</Button>
        <Button onClick={showYellowContent}>Yellow content</Button>
        <Button onClick={showBlueContent}>Blue content</Button>
      </div>
      <LayoutProvider onLayoutChange={handleLayoutChange} layout={layout}>
        <DraggableLayout
          dropTarget
          id="layout-root"
          style={{
            inset: "60px 0 0 0",
            position: "absolute",
          }}
        >
          <div style={{ backgroundColor: "green", height: "100%" }} />
        </DraggableLayout>
      </LayoutProvider>
    </>
  );
};
StaticTemplateNoChrome.displaySequence = displaySequence++;

export const LeftRightChrome = () => {
  const handleLayoutChange = useCallback<LayoutChangeHandler>((layout) => {
    console.log({ layout });
  }, []);

  const [layout, setLayout] = useState<LayoutJSON>();
  const showRedContent = () => setLayout(contentRed);
  const showYellowContent = () => setLayout(contentYellow);
  const showBlueContent = () => setLayout(contentBlue);

  return (
    <>
      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: "var(--salt-spacing-100)",
          height: 60,
          padding: "0 var(--salt-spacing-100)",
        }}
      >
        <Button onClick={showRedContent}>Red content</Button>
        <Button onClick={showYellowContent}>Yellow content</Button>
        <Button onClick={showBlueContent}>Blue content</Button>
      </div>
      <LayoutProvider onLayoutChange={handleLayoutChange} layout={layout}>
        <DraggableLayout
          id="layout-root"
          style={{
            inset: "60px 0 0 0",
            position: "absolute",
          }}
        >
          <Flexbox
            className="App"
            style={{
              flexDirection: "row",
              height: "100%",
              width: "100%",
            }}
          >
            <div style={{ backgroundColor: "gray", width: 100 }} />
            <DraggableLayout
              className="the-goat"
              dropTarget
              key="main-content"
              style={{ flex: 1 }}
            >
              <div style={{ backgroundColor: "green", height: "100%" }} />
            </DraggableLayout>
            <div style={{ backgroundColor: "gray", width: 100 }} />
          </Flexbox>
        </DraggableLayout>
      </LayoutProvider>
    </>
  );
};
LeftRightChrome.displaySequence = displaySequence++;
