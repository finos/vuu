import {
  Component,
  LayoutContainer,
  Flexbox,
  LayoutProvider,
  Palette,
  PaletteItem,
  Placeholder,
  View,
} from "@vuu-ui/vuu-layout";

import "./LayoutContainer.examples.css";

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
          <PaletteItem
            component={
              <Component
                style={{ backgroundColor: "cornflowerblue", height: "100%" }}
              />
            }
            label="Blue Monday"
            resizeable
            header
          ></PaletteItem>
          <PaletteItem
            component={
              <Component style={{ backgroundColor: "brown", height: "100%" }} />
            }
            label="Brown Sugar"
            resizeable
            header
          ></PaletteItem>
          <PaletteItem
            component={
              <Component style={{ backgroundColor: "green", height: "100%" }} />
            }
            label="Green Day"
            resizeable
            header
          ></PaletteItem>
          <PaletteItem
            component={
              <Component
                style={{ backgroundColor: "yellow", height: "100%" }}
              />
            }
            label="Lemonheads"
            resizeable
            header
          ></PaletteItem>
        </Palette>
      </View>
      <LayoutContainer style={{ flex: 1 }} dropTarget resizeable>
        <View resizeable style={{ height: "calc(100% - 6px)" }}>
          <Placeholder />
        </View>
      </LayoutContainer>
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
    <Palette orientation="vertical" style={{ width: "100%", height: "100%" }}>
      <div data-header>Pages</div>
      <PaletteItem
        component={
          <Component
            style={{ backgroundColor: "cornflowerblue", height: "100%" }}
          />
        }
        title="Blue Monday"
        resizeable
        header
      ></PaletteItem>
      <PaletteItem
        component={
          <Component style={{ backgroundColor: "brown", height: "100%" }} />
        }
        title="Brown Sugar"
        resizeable
        header
      ></PaletteItem>
      <PaletteItem
        component={
          <Component style={{ backgroundColor: "green", height: "100%" }} />
        }
        title="Green Day"
        resizeable
        header
      ></PaletteItem>
      <PaletteItem
        component={
          <Component style={{ backgroundColor: "yellow", height: "100%" }} />
        }
        title="Lemonheads"
        resizeable
        header
      ></PaletteItem>
      <div data-header>Layouts</div>
      <PaletteItem
        component={
          <Component style={{ backgroundColor: "yellow", height: "100%" }} />
        }
        title="Lemonheads"
        resizeable
        header
      ></PaletteItem>
      <PaletteItem
        component={
          <Component style={{ backgroundColor: "yellow", height: "100%" }} />
        }
        title="Lemonheads"
        resizeable
        header
      ></PaletteItem>
      <PaletteItem
        component={
          <Component style={{ backgroundColor: "yellow", height: "100%" }} />
        }
        title="Lemonheads"
        resizeable
        header
      ></PaletteItem>
      <div data-header>Components</div>
      <PaletteItem
        component={
          <Component style={{ backgroundColor: "yellow", height: "100%" }} />
        }
        title="Lemonheads"
        resizeable
        header
      ></PaletteItem>
      <PaletteItem
        component={
          <Component style={{ backgroundColor: "yellow", height: "100%" }} />
        }
        title="Lemonheads"
        resizeable
        header
      ></PaletteItem>
      <PaletteItem
        component={
          <Component style={{ backgroundColor: "yellow", height: "100%" }} />
        }
        title="Lemonheads"
        resizeable
        header
      ></PaletteItem>
      <PaletteItem
        component={
          <Component style={{ backgroundColor: "yellow", height: "100%" }} />
        }
        title="Lemonheads"
        resizeable
        header
      ></PaletteItem>
      <PaletteItem
        component={
          <Component style={{ backgroundColor: "yellow", height: "100%" }} />
        }
        title="Lemonheads"
        resizeable
        header
      ></PaletteItem>
    </Palette>
  </View>
);
