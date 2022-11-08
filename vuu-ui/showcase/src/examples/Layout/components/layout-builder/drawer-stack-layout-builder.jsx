import React from "react";

import {
  Chest,
  Drawer,
  FlexboxLayout as Flexbox,
  Component,
  DraggableLayout,
  Palette,
  PaletteItem,
  StackLayout as Stack,
  View,
} from "@vuu-ui/vuu-layout";
import * as layout from "../layouts";

import "./layout-builder.css";

export const DrawerStackLayoutBuilder = ({ width = 800, height = 1000 }) => {
  return (
    <DraggableLayout style={{ width: "100vw", height: "100vh" }}>
      <Flexbox
        className="LayoutBuilder"
        style={{ flexDirection: "column", width: "100%", height: "100%" }}
      >
        <div style={{ height: 60, borderBottom: "solid 1px #ccc" }} />
        <Chest style={{ flex: 1 }}>
          <Drawer
            clickToOpen
            peekaboo
            position="left"
            inline
            sizeOpen={150}
            toggleButton="end"
          >
            <View header title="View Tables">
              <Palette
                collapsibleHeaders
                orientation="vertical"
                style={{ width: 150, flex: 1 }}
              >
                <div data-header>Layouts</div>
                <PaletteItem
                  title="Holy Grail"
                  template
                  closeable
                  resizeable
                  header
                >
                  {layout.holyGrail}
                </PaletteItem>
                <PaletteItem
                  title="2 Rows"
                  template
                  closeable
                  resizeable
                  header
                >
                  {layout.twoRows}
                </PaletteItem>
                <PaletteItem
                  title="3 Rows"
                  template
                  closeable
                  resizeable
                  header
                >
                  {layout.threeRows}
                </PaletteItem>
                <PaletteItem
                  title="4 Rows"
                  template
                  closeable
                  resizeable
                  header
                >
                  {layout.fourRows}
                </PaletteItem>
                <PaletteItem
                  title="2 Columns"
                  template
                  closeable
                  resizeable
                  header
                >
                  {layout.twoColumns}
                </PaletteItem>
                <div data-header>Tables</div>
                <PaletteItem title="Instruments" header>
                  <Component
                    style={{
                      backgroundColor: "rgba(0,0,255,.3)",
                      height: "100%",
                    }}
                  />
                </PaletteItem>
                <PaletteItem title="Brown Sugar" closeable resizeable header>
                  <Component
                    style={{
                      backgroundColor: "rgba(255,0,0,.5)",
                      height: "100%",
                    }}
                  />
                </PaletteItem>
                <PaletteItem title="Green Day" closeable resizeable header>
                  <Component
                    style={{
                      backgroundColor: "rgba(0,255,0,.5)",
                      height: "100%",
                    }}
                  />
                </PaletteItem>
                <PaletteItem title="Lemonheads" closeable resizeable header>
                  <Component
                    style={{
                      backgroundColor: "rgba(255,255,0,.4)",
                      height: "100%",
                    }}
                  />
                </PaletteItem>
              </Palette>
            </View>
          </Drawer>
          <DraggableLayout style={{ width: "100%", height: "100%" }} dropTarget>
            <Stack
              style={{ width: "100%", height: "100%" }}
              enableAddTab
              preserve
              showTabs
            >
              <View title="Page 1" style={{ flex: 1 }} resizeable />
            </Stack>
          </DraggableLayout>
        </Chest>
      </Flexbox>
    </DraggableLayout>
  );
};
