import {
  Component,
  DraggableLayout,
  Flexbox,
  LayoutProvider,
  Palette,
  PaletteItem,
  Placeholder,
  View,
} from "@vuu-ui/vuu-layout";

import "./DraggableLayout.stories.css";

export default {
  title: "Layout/Palette",
  component: Palette,
};

export const SimplePalette = () => (
  <LayoutProvider>
    <Flexbox style={{ width: 900, height: 800 }}>
      <View
        header
        title="Palette"
        style={{
          border: "solid 1px #ccc",
          flexBasis: 200,
          flexGrow: 0,
          flexShrink: 0,
        }}
      >
        <Palette
          orientation="vertical"
          style={{ width: "100%", height: "100%" }}
        >
          <PaletteItem label="Blue Monday" resizeable header>
            <Component
              style={{ backgroundColor: "cornflowerblue", height: "100%" }}
            />
          </PaletteItem>
          <PaletteItem label="Brown Sugar" resizeable header>
            <Component style={{ backgroundColor: "brown", height: "100%" }} />
          </PaletteItem>
          <PaletteItem label="Green Day" resizeable header>
            <Component style={{ backgroundColor: "green", height: "100%" }} />
          </PaletteItem>
          <PaletteItem label="Lemonheads" resizeable header>
            <Component style={{ backgroundColor: "yellow", height: "100%" }} />
          </PaletteItem>
        </Palette>
      </View>
      <DraggableLayout style={{ flex: 1 }} dropTarget resizeable>
        <View resizeable style={{ height: "calc(100% - 6px)" }}>
          <Placeholder />
        </View>
      </DraggableLayout>
    </Flexbox>
  </LayoutProvider>
);

export const StructuredPalette = () => (
  <View
    header
    title="Palette"
    style={{
      border: "solid 1px #ccc",
      left: 20,
      top: 20,
      height: 600,
      position: "absolute",
      width: 200,
    }}
  >
    <Palette
      collapsibleHeaders
      orientation="vertical"
      style={{ width: "100%", height: "100%" }}
    >
      <div data-header>Pages</div>
      <PaletteItem title="Blue Monday" resizeable header>
        <Component
          style={{ backgroundColor: "cornflowerblue", height: "100%" }}
        />
      </PaletteItem>
      <PaletteItem title="Brown Sugar" resizeable header>
        <Component style={{ backgroundColor: "brown", height: "100%" }} />
      </PaletteItem>
      <PaletteItem title="Green Day" resizeable header>
        <Component style={{ backgroundColor: "green", height: "100%" }} />
      </PaletteItem>
      <PaletteItem title="Lemonheads" resizeable header>
        <Component style={{ backgroundColor: "yellow", height: "100%" }} />
      </PaletteItem>
      <div data-header>Layouts</div>
      <PaletteItem title="Lemonheads" resizeable header>
        <Component style={{ backgroundColor: "yellow", height: "100%" }} />
      </PaletteItem>
      <PaletteItem title="Lemonheads" resizeable header>
        <Component style={{ backgroundColor: "yellow", height: "100%" }} />
      </PaletteItem>
      <PaletteItem title="Lemonheads" resizeable header>
        <Component style={{ backgroundColor: "yellow", height: "100%" }} />
      </PaletteItem>
      <div data-header>Components</div>
      <PaletteItem title="Lemonheads" resizeable header>
        <Component style={{ backgroundColor: "yellow", height: "100%" }} />
      </PaletteItem>
      <PaletteItem title="Lemonheads" resizeable header>
        <Component style={{ backgroundColor: "yellow", height: "100%" }} />
      </PaletteItem>
      <PaletteItem title="Lemonheads" resizeable header>
        <Component style={{ backgroundColor: "yellow", height: "100%" }} />
      </PaletteItem>
      <PaletteItem title="Lemonheads" resizeable header>
        <Component style={{ backgroundColor: "yellow", height: "100%" }} />
      </PaletteItem>
      <PaletteItem title="Lemonheads" resizeable header>
        <Component style={{ backgroundColor: "yellow", height: "100%" }} />
      </PaletteItem>
    </Palette>
  </View>
);
