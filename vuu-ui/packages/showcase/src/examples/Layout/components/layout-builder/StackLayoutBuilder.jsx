import { ToolkitProvider } from "@heswell/uitk-core";
import {
  FlexboxLayout,
  Component,
  DraggableLayout,
  LayoutProvider,
  PaletteUitk as Palette,
  PaletteListItem,
  Placeholder,
  StackLayout,
  View,
} from "@vuu-ui/layout";
import { ListItemHeader } from "@heswell/uitk-lab";
import * as layout from "../layouts";

import "./layout-builder.css";

export const StackLayoutBuilderUitk = ({ width = 800, height = 1000 }) => {
  const onLayoutModel = (layoutModel) => {
    console.log({ layoutModel });
    // setState(prevState => ({
    //     ...prevState,
    //     managedLayoutNode: layoutModel
    // }));
  };

  return (
    <ToolkitProvider density="high">
      <LayoutProvider>
        <DraggableLayout style={{ width: "100%", height: "100%" }}>
          <FlexboxLayout
            className="LayoutBuilder"
            style={{ flexDirection: "column", width: "100%", height: "100%" }}
          >
            <FlexboxLayout style={{ flexDirection: "row", flex: 1 }}>
              <View
                className="builder-top"
                header
                resizeable
                style={{
                  flexBasis: 200,
                  flexGrow: 0,
                  flexShrink: 0,
                }}
                title="Palette"
              >
                <Palette style={{ backgroundColor: "inherit" }}>
                  <PaletteListItem
                    ViewProps={{
                      closeable: true,
                      header: true,
                      resizeable: true,
                    }}
                    label="Page 1"
                    template
                  >
                    {layout.twoRows}
                  </PaletteListItem>
                  <PaletteListItem
                    ViewProps={{
                      closeable: true,
                      header: true,
                      resizeable: true,
                    }}
                    label="Page 2"
                    template
                  >
                    {layout.twoRows}
                  </PaletteListItem>

                  <ListItemHeader data-header>Flex Layouts</ListItemHeader>
                  <PaletteListItem
                    ViewProps={{
                      closeable: true,
                      header: true,
                      resizeable: true,
                    }}
                    label="Holy Grail"
                    template
                  >
                    {layout.holyGrail}
                  </PaletteListItem>
                  <PaletteListItem label="Responsive Example" template>
                    {layout.responsiveExample}
                  </PaletteListItem>
                  <PaletteListItem
                    label="2 Rows"
                    ViewProps={{
                      closeable: true,
                      header: true,
                      resizeable: true,
                    }}
                    template
                  >
                    {layout.twoRows}
                  </PaletteListItem>
                  <PaletteListItem
                    label="3 Rows"
                    template
                    ViewProps={{
                      closeable: true,
                      header: true,
                      resizeable: true,
                    }}
                  >
                    {layout.threeRows}
                  </PaletteListItem>
                  <PaletteListItem
                    label="4 Rows"
                    template
                    ViewProps={{
                      closeable: true,
                      header: true,
                      resizeable: true,
                    }}
                  >
                    {layout.fourRows}
                  </PaletteListItem>
                  <PaletteListItem label="Fluid Grid 12 rows" template>
                    {layout.responsive_12_col}
                  </PaletteListItem>

                  <ListItemHeader>Intrinsic Size Components</ListItemHeader>
                  <PaletteListItem
                    label="Small 200 x 150"
                    ViewProps={{
                      closeable: true,
                      header: true,
                      style: { width: 200, height: 150 },
                    }}
                  >
                    <Component
                      style={{
                        backgroundColor: "rgba(0,0,255,.3)",
                        height: "100%",
                      }}
                    />
                  </PaletteListItem>
                  <PaletteListItem
                    label="Medium 300 x 250"
                    ViewProps={{
                      closeable: true,
                      header: true,
                      style: { width: 300, height: 250 },
                    }}
                  >
                    <Component
                      style={{
                        backgroundColor: "rgba(0,255,255,.3)",
                        height: "100%",
                      }}
                    />
                  </PaletteListItem>
                  <div data-header>Flex Components</div>
                  <PaletteListItem
                    label="Brown Sugar"
                    ViewProps={{
                      closeable: true,
                      header: true,
                      resizeable: true,
                    }}
                  >
                    <Component
                      style={{
                        backgroundColor: "rgba(255,0,0,.5)",
                        height: "100%",
                      }}
                    />
                  </PaletteListItem>
                  <PaletteListItem
                    label="Green Day"
                    ViewProps={{
                      closeable: true,
                      header: true,
                      resizeable: true,
                    }}
                  >
                    <Component
                      style={{
                        backgroundColor: "rgba(0,255,0,.5)",
                        height: "100%",
                      }}
                    />
                  </PaletteListItem>
                  <PaletteListItem
                    label="Lemonheads"
                    ViewProps={{
                      closeable: true,
                      header: true,
                      resizeable: true,
                    }}
                  >
                    <Component
                      style={{
                        backgroundColor: "rgba(255,255,0,.4)",
                        height: "100%",
                      }}
                    />
                  </PaletteListItem>
                  <ListItemHeader>Content Layouts</ListItemHeader>
                  <PaletteListItem
                    label="3 Rows"
                    template
                    ViewProps={{
                      closeable: true,
                      header: true,
                      resizeable: true,
                    }}
                  >
                    {layout.threeRowsContent}
                  </PaletteListItem>
                  <PaletteListItem
                    label="3 Columns"
                    template
                    ViewProps={{
                      closeable: true,
                      header: true,
                      resizeable: true,
                    }}
                  >
                    {layout.threeColumnsContent}
                  </PaletteListItem>
                  <ListItemHeader>Sized Components</ListItemHeader>
                  <PaletteListItem
                    label="Yellow 150"
                    ViewProps={{
                      closeable: true,
                      header: true,
                      resizeable: true,
                    }}
                    template
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
                  </PaletteListItem>
                  <PaletteListItem
                    label="Pink 250"
                    ViewProps={{
                      closeable: true,
                      header: true,
                      resizeable: true,
                    }}
                    template
                  >
                    <Component
                      style={{
                        backgroundColor: "pink",
                        flexBasis: 250,
                        flexGrow: 0,
                        flexShrink: 0,
                      }}
                    />
                  </PaletteListItem>
                  <PaletteListItem
                    label="Blue 400"
                    ViewProps={{
                      closeable: true,
                      header: true,
                      resizeable: true,
                    }}
                    template
                  >
                    <Component
                      style={{
                        backgroundColor: "cornflowerblue",
                        flexBasis: 400,
                        flexGrow: 0,
                        flexShrink: 0,
                      }}
                    />
                  </PaletteListItem>
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
    </ToolkitProvider>
  );
};
