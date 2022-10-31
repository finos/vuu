import {
  registerComponent,
  Component,
  Palette,
  PaletteItem,
  View,
} from "@vuu-ui/layout";

import "./DraggableLayout.stories.css";

export default {
  title: "Layout/Palette",
  component: Palette,
};

const StandardToolbar = () => (
  <Toolbar style={{ justifyContent: "flex-end" }} draggable showTitle></Toolbar>
);
registerComponent("StandardToolbar", StandardToolbar);

export const SimplePalette = () => (
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
    <Palette orientation="vertical" style={{ width: "100%", height: "100%" }}>
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
    </Palette>
  </View>
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
