import {
  FlexboxLayout,
  Component,
  DraggableLayout,
  LayoutProvider,
  Palette,
  PaletteItem,
  Placeholder,
  StackLayout,
  View,
} from "@vuu-ui/layout";
import * as layout from "../layouts";

import "./layout-builder.css";

export const StackLayoutBuilder = ({ width = 800, height = 1000 }) => {
  const onLayoutModel = (layoutModel) => {
    console.log({ layoutModel });
    // setState(prevState => ({
    //     ...prevState,
    //     managedLayoutNode: layoutModel
    // }));
  };

  return (
    <LayoutProvider>
      <DraggableLayout style={{ width: "100%", height: "100%" }}>
        <FlexboxLayout
          className="LayoutBuilder"
          style={{ flexDirection: "column", width: "100%", height: "100%" }}
        >
          <div style={{ height: 60, borderBottom: "solid 1px #ccc" }} />
          <FlexboxLayout
            style={{ flexDirection: "row", flex: 1 }}
            id="flex-main"
          >
            <View
              className="builder-top"
              header
              resizeable
              style={{ flexBasis: 200, flexGrow: 0, flexShrink: 0 }}
              title="Palette"
              dropTargets={["flex-main"]}
            >
              <Palette
                collapsibleHeaders
                orientation="vertical"
                style={{ backgroundColor: "inherit" }}
              >
                <div data-header>Pages</div>
                <PaletteItem
                  label="Page 1"
                  template
                  closeable
                  resizeable
                  header
                >
                  {layout.twoRows}
                </PaletteItem>
                <PaletteItem
                  label="Page 2"
                  template
                  closeable
                  resizeable
                  header
                >
                  {layout.twoRows}
                </PaletteItem>

                <div data-header>Flex Layouts</div>
                <PaletteItem
                  label="Holy Grail"
                  template
                  closeable
                  resizeable
                  header
                >
                  {layout.holyGrail}
                </PaletteItem>
                <PaletteItem label="Responsive Example" template>
                  {layout.responsiveExample}
                </PaletteItem>
                <PaletteItem
                  label="2 Rows"
                  template
                  closeable
                  resizeable
                  header
                >
                  {layout.twoRows}
                </PaletteItem>
                <PaletteItem
                  label="3 Rows"
                  template
                  closeable
                  resizeable
                  header
                >
                  {layout.threeRows}
                </PaletteItem>
                <PaletteItem
                  label="4 Rows"
                  template
                  closeable
                  resizeable
                  header
                >
                  {layout.fourRows}
                </PaletteItem>
                <PaletteItem label="Fluid Grid 12 rows" template>
                  {layout.responsive_12_col}
                </PaletteItem>

                <div data-header>Intrinsic Size Components</div>
                <PaletteItem
                  label="Small 200 x 150"
                  closeable
                  header
                  style={{ width: 200, height: 150 }}
                >
                  <Component
                    style={{
                      backgroundColor: "rgba(0,0,255,.3)",
                      height: "100%",
                    }}
                  />
                </PaletteItem>
                <PaletteItem
                  label="Medium 300 x 250"
                  closeable
                  header
                  style={{ width: 300, height: 250 }}
                >
                  <Component
                    style={{
                      backgroundColor: "rgba(0,255,255,.3)",
                      height: "100%",
                    }}
                  />
                </PaletteItem>
                <div data-header>Flex Components</div>
                <PaletteItem label="Brown Sugar" closeable resizeable header>
                  <Component
                    style={{
                      backgroundColor: "rgba(255,0,0,.5)",
                      height: "100%",
                    }}
                  />
                </PaletteItem>
                <PaletteItem label="Green Day" closeable resizeable header>
                  <Component
                    style={{
                      backgroundColor: "rgba(0,255,0,.5)",
                      height: "100%",
                    }}
                  />
                </PaletteItem>
                <PaletteItem label="Lemonheads" closeable resizeable header>
                  <Component
                    style={{
                      backgroundColor: "rgba(255,255,0,.4)",
                      height: "100%",
                    }}
                  />
                </PaletteItem>
                <div data-header>Content Layouts</div>
                <PaletteItem
                  label="3 Rows"
                  template
                  closeable
                  resizeable
                  header
                >
                  {layout.threeRowsContent}
                </PaletteItem>
                <PaletteItem
                  label="3 Columns"
                  template
                  closeable
                  resizeable
                  header
                >
                  {layout.threeColumnsContent}
                </PaletteItem>
                <div data-header>Sized Components</div>
                <PaletteItem
                  label="Yellow 150"
                  closeable
                  resizeable
                  template
                  header
                >
                  <Component
                    style={{
                      backgroundColor: "yellow",
                      flexBasis: 150,
                      flexGrow: 0,
                      flexShrink: 0,
                      minHeight: 100,
                    }}
                  />
                </PaletteItem>
                <PaletteItem
                  label="Pink 250"
                  closeable
                  resizeable
                  template
                  header
                >
                  <Component
                    style={{
                      backgroundColor: "pink",
                      flexBasis: 250,
                      flexGrow: 0,
                      flexShrink: 0,
                    }}
                  />
                </PaletteItem>
                <PaletteItem
                  label="Blue 400"
                  closeable
                  resizeable
                  template
                  header
                >
                  <Component
                    style={{
                      backgroundColor: "cornflowerblue",
                      flexBasis: 400,
                      flexGrow: 0,
                      flexShrink: 0,
                    }}
                  />
                </PaletteItem>
              </Palette>
            </View>
            <DraggableLayout
              style={{ flex: 1 }}
              dropTarget
              onLayoutModel={onLayoutModel}
              resizeable
              id="main-drag"
            >
              <StackLayout
                showTabs
                style={{ width: "100%", height: "100%" }}
                enableCloseTabs
                preserve
              >
                <Placeholder title="Page 1" closeable={false} id={1} />
                <View title="Page 2" style={{ flex: 1 }} id={2}>
                  <Component
                    style={{
                      width: "100%",
                      height: "100%",
                      backgroundColor: "yellow",
                    }}
                    resizeable
                  />
                </View>
              </StackLayout>
            </DraggableLayout>
          </FlexboxLayout>
        </FlexboxLayout>
      </DraggableLayout>
    </LayoutProvider>
  );
};
