import { SyntheticEvent, useRef, useState } from "react";

import {
  Chest,
  Component,
  Drawer,
  Flexbox,
  Stack,
  View,
} from "@finos/vuu-layout";
import { List, ListItem } from "@heswell/salt-lab";
import { Button } from "@salt-ds/core";

import "./Chest.stories.css";

let displaySequence = 1;

type InlineDrawerProps = {
  inline?: boolean;
  position: "left" | "right" | "top" | "bottom";
  peekaboo?: boolean;
};

const InlineDrawer = ({
  inline = false,
  position,
  peekaboo = false,
}: InlineDrawerProps) => {
  const list = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const handleClick = (e: SyntheticEvent) => {
    if (!list.current?.contains(e.target as HTMLElement)) {
      setOpen(!open);
    }
  };
  return (
    <Chest style={{ width: "100%", height: "100%" }}>
      <Drawer
        inline={inline}
        onClick={handleClick}
        open={open}
        peekaboo={peekaboo}
        position={position}
        title="Rebecca"
        defaultOpen={false}
      >
        <List>
          <ListItem>Item 1</ListItem>
          <ListItem>Item 2</ListItem>
          <ListItem>Item 3</ListItem>
          <ListItem>Item 4</ListItem>
          <ListItem>Item 5</ListItem>
          <ListItem>Item 6</ListItem>
        </List>
      </Drawer>
      <Component
        title="Cornflower"
        style={{
          backgroundColor: "cornflowerblue",
          height: "100%",
          width: "100%",
        }}
        onClick={handleClick}
      />
    </Chest>
  );
};

export const LeftInlineDrawerPeek = () => (
  <InlineDrawer position="left" inline peekaboo />
);
LeftInlineDrawerPeek.displaySequence = displaySequence++;

export const RightInlineDrawerPeek = () => (
  <InlineDrawer position="right" inline peekaboo />
);
RightInlineDrawerPeek.displaySequence = displaySequence++;

export const TopInlineDrawerPeek = () => (
  <InlineDrawer position="top" inline peekaboo />
);
TopInlineDrawerPeek.displaySequence = displaySequence++;

export const BottomInlineDrawerPeek = () => (
  <InlineDrawer position="bottom" inline peekaboo />
);
BottomInlineDrawerPeek.displaySequence = displaySequence++;

export const LeftOverlayDrawerPeek = () => (
  <InlineDrawer position="left" peekaboo />
);
LeftOverlayDrawerPeek.displaySequence = displaySequence++;

export const RightOverlayDrawerPeek = () => (
  <InlineDrawer position="right" peekaboo />
);
RightOverlayDrawerPeek.displaySequence = displaySequence++;

export const TopOverlayDrawerPeek = () => (
  <InlineDrawer position="top" peekaboo />
);
TopOverlayDrawerPeek.displaySequence = displaySequence++;

export const BottomOverlayDrawerPeek = () => (
  <InlineDrawer position="bottom" peekaboo />
);
BottomOverlayDrawerPeek.displaySequence = displaySequence++;

export const LeftInlineDrawer = () => <InlineDrawer position="left" inline />;
LeftInlineDrawer.displaySequence = displaySequence++;

export const RightInlineDrawer = () => <InlineDrawer position="right" inline />;
RightInlineDrawer.displaySequence = displaySequence++;

export const TopInlineDrawer = () => <InlineDrawer position="top" inline />;
TopInlineDrawer.displaySequence = displaySequence++;

export const BottomInlineDrawer = () => (
  <InlineDrawer position="bottom" inline />
);
BottomInlineDrawer.displaySequence = displaySequence++;

export const LeftOverlayDrawer = () => <InlineDrawer position="left" />;

export const RightOverlayDrawer = () => <InlineDrawer position="right" />;

export const TopOverlayDrawer = () => <InlineDrawer position="top" />;

export const BottomOverlayDrawer = () => <InlineDrawer position="bottom" />;

export const LeftInlineDrawerStack = () => {
  const [open, setOpen] = useState(false);
  const handleClick = () => setOpen(!open);
  return (
    <Flexbox style={{ width: 900, height: 700, flexDirection: "column" }}>
      <Chest style={{ flex: 1, "--hw-chest-bg": "inherit" }}>
        <Drawer
          inline
          peekaboo
          onClick={handleClick}
          open={open}
          position="left"
          title="Rebecca"
          defaultOpen={false}
        ></Drawer>
        <Stack showTabs style={{ width: "100%", height: "100%" }}>
          <Component
            title="Cornflower"
            resizeable
            style={{ backgroundColor: "cornflowerblue", flex: 1 }}
            onClick={handleClick}
          />
          <Component
            title="Rebeccas"
            resizeable
            style={{ backgroundColor: "rebeccapurple", flex: 1 }}
            onClick={handleClick}
          />
        </Stack>
      </Chest>

      <div style={{ height: 40, backgroundColor: "#ccc" }} />
    </Flexbox>
  );
};
export const LeftInlineDrawerFlexbox = () => {
  const [open, setOpen] = useState(false);
  const handleClick = () => setOpen(!open);
  return (
    <Chest style={{ width: "100vw", height: "100vh" }}>
      <Drawer
        inline
        onClick={handleClick}
        open={open}
        position="left"
        title="Rebecca"
        defaultOpen={false}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "flex-end",
          }}
        >
          <div
            style={{
              height: 40,
              width: "100%",
              backgroundColor: "#ddd",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              paddingRight: 4,
            }}
          >
            {open ? (
              <Button
                onClick={handleClick}
                data-icon="chevron-double-left"
                style={{ "--vuu-icon-size": "12px", width: 28 }}
              />
            ) : null}
          </div>
        </div>
      </Drawer>
      <Flexbox
        style={{ width: "100%", height: "100%", flexDirection: "column" }}
      >
        <Flexbox style={{ flex: 1 }}>
          <View
            className="viewCornflower"
            title="Cornflower"
            header
            resizeable
            style={{ flex: 1 }}
          >
            <Component onClick={handleClick} style={{ height: "100%" }} />
          </View>
          <View
            className="viewRebecca"
            title="Rebecca"
            header
            style={{ flex: 1 }}
            resizeable
            resize="defer"
          >
            <Component onClick={handleClick} />
          </View>
        </Flexbox>
        <div style={{ height: 40, backgroundColor: "#ccc" }}>
          {open ? (
            <Button
              onClick={handleClick}
              data-icon="chevron-double-left"
              style={{ "--vuu-icon-size": "12px", width: 28 }}
            />
          ) : null}
        </div>
      </Flexbox>
    </Chest>
  );
};

export const InlineDrawerFlexboxVariants = () => {
  const [open, setOpen] = useState(false);
  const handleClick = () => setOpen(!open);
  return (
    <>
      <Chest style={{ width: 700, height: 300, margin: 50 }}>
        <Drawer
          inline
          onClick={handleClick}
          open={open}
          position="left"
          title="Rebecca"
          defaultOpen={false}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "flex-end",
            }}
          >
            <div style={{ height: 40, width: "100%" }}>
              {open ? (
                <Button
                  onClick={handleClick}
                  data-icon="chevron-double-left"
                  style={{ "--vuu-icon-size": "12px", width: 28 }}
                />
              ) : null}
            </div>
          </div>
        </Drawer>
        <Flexbox
          style={{ width: "100%", height: "100%", flexDirection: "column" }}
        >
          <Flexbox style={{ flex: 1 }}>
            <Component
              title="Cornflower"
              resizeable
              style={{ backgroundColor: "cornflowerblue", flex: 1 }}
              onClick={handleClick}
            />
            <Component
              title="Rebeccas"
              resizeable
              style={{ backgroundColor: "rebeccapurple", flex: 1 }}
              onClick={handleClick}
            />
          </Flexbox>
          <div style={{ height: 40, backgroundColor: "#ccc" }}>
            {open ? (
              <Button
                onClick={handleClick}
                data-icon="chevron-double-left"
                style={{ "--vuu-icon-size": "12px", width: 28 }}
              />
            ) : null}
          </div>
        </Flexbox>
      </Chest>

      <Flexbox
        style={{ width: 700, height: 300, margin: 50, flexDirection: "column" }}
      >
        <Chest style={{ flex: 1 }}>
          <Drawer
            inline
            onClick={handleClick}
            open={open}
            position="left"
            title="Rebecca"
            defaultOpen={false}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "flex-end",
              }}
            ></div>
          </Drawer>
          <Flexbox style={{ width: "100%", height: "100%" }}>
            <Component
              title="Cornflower"
              resizeable
              style={{ backgroundColor: "cornflowerblue", flex: 1 }}
              onClick={handleClick}
            />
            <Component
              title="Rebeccas"
              resizeable
              style={{ backgroundColor: "rebeccapurple", flex: 1 }}
              onClick={handleClick}
            />
          </Flexbox>
        </Chest>
        <div style={{ height: 40, backgroundColor: "#ccc" }}>
          {open ? (
            <Button
              onClick={handleClick}
              data-icon="chevron-double-left"
              style={{ "--vuu-icon-size": "12px", width: 28 }}
            />
          ) : (
            <Button
              onClick={handleClick}
              data-icon="chevron-double-right"
              style={{ "--vuu-icon-size": "12px", width: 28 }}
            />
          )}
        </div>
      </Flexbox>
    </>
  );
};

export const CustomSizeDrawer = () => {
  return (
    <Chest style={{ width: "100vw", height: "100vh" }}>
      <Drawer
        clickToOpen
        inline
        sizeClosed={24}
        sizeOpen={100}
        position="left"
        peekaboo
        defaultOpen={false}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "flex-end",
          }}
        >
          <div
            style={{ height: 40, width: "100%", backgroundColor: "#ddd" }}
          ></div>
        </div>
      </Drawer>
      <Flexbox
        style={{ width: "100%", height: "100%", flexDirection: "column" }}
      >
        <Flexbox style={{ flex: 1 }}>
          <Component
            title="Cornflower"
            resizeable
            style={{ backgroundColor: "cornflowerblue", flex: 1 }}
          />
          <Component
            title="Rebeccas"
            resizeable
            style={{ backgroundColor: "rebeccapurple", flex: 1 }}
          />
        </Flexbox>
        <div style={{ height: 40, backgroundColor: "#ccc" }}></div>
      </Flexbox>
    </Chest>
  );
};

export const WithToggleButton = () => {
  return (
    <Chest style={{ width: "100vw", height: "100vh" }}>
      <Drawer
        inline
        position="left"
        peekaboo
        toggleButton="end"
        defaultOpen={false}
      />
      <Flexbox
        style={{ width: "100%", height: "100%", flexDirection: "column" }}
      >
        <Flexbox style={{ flex: 1 }}>
          <Component
            title="Cornflower"
            resizeable
            style={{ backgroundColor: "cornflowerblue", flex: 1 }}
          />
          <Component
            title="Rebeccas"
            resizeable
            style={{ backgroundColor: "rebeccapurple", flex: 1 }}
          />
        </Flexbox>
      </Flexbox>
    </Chest>
  );
};
