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
import { OptionGroup } from "@salt-ds/core";

const viewProps = {
  resizeable: true,
  header: true,
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
          <PaletteItem
            component={
              <Component
                style={{ backgroundColor: "cornflowerblue", height: "100%" }}
              />
            }
            value="Blue Monday"
            ViewProps={viewProps}
          ></PaletteItem>
          <PaletteItem
            component={
              <Component style={{ backgroundColor: "brown", height: "100%" }} />
            }
            value="Brown Sugar"
            ViewProps={viewProps}
          ></PaletteItem>
          <PaletteItem
            component={
              <Component style={{ backgroundColor: "green", height: "100%" }} />
            }
            value="Green Day"
            ViewProps={viewProps}
          ></PaletteItem>
          <PaletteItem
            component={
              <Component
                style={{ backgroundColor: "yellow", height: "100%" }}
              />
            }
            value="Lemonheads"
            ViewProps={viewProps}
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
      <OptionGroup label="Pages" key="Pages">
        <PaletteItem
          component={
            <Component
              style={{ backgroundColor: "cornflowerblue", height: "100%" }}
            />
          }
          value="Blue Monday"
          ViewProps={viewProps}
        ></PaletteItem>
        <PaletteItem
          component={
            <Component style={{ backgroundColor: "brown", height: "100%" }} />
          }
          value="Brown Sugar"
          ViewProps={viewProps}
        ></PaletteItem>
        <PaletteItem
          component={
            <Component style={{ backgroundColor: "green", height: "100%" }} />
          }
          value="Green Day"
          ViewProps={viewProps}
        ></PaletteItem>
        <PaletteItem
          component={
            <Component style={{ backgroundColor: "yellow", height: "100%" }} />
          }
          value="Lemonheads"
          ViewProps={viewProps}
        ></PaletteItem>
      </OptionGroup>
      <OptionGroup label="Layouts" key="Layouts">
        <PaletteItem
          component={
            <Component style={{ backgroundColor: "yellow", height: "100%" }} />
          }
          value="Lemonheads"
          ViewProps={viewProps}
        ></PaletteItem>
        <PaletteItem
          component={
            <Component style={{ backgroundColor: "yellow", height: "100%" }} />
          }
          value="Lemonheads"
          ViewProps={viewProps}
        ></PaletteItem>
        <PaletteItem
          component={
            <Component style={{ backgroundColor: "yellow", height: "100%" }} />
          }
          value="Lemonheads"
          ViewProps={viewProps}
        ></PaletteItem>
      </OptionGroup>
      <OptionGroup label="Components" key="Components">
        <PaletteItem
          component={
            <Component style={{ backgroundColor: "yellow", height: "100%" }} />
          }
          value="Lemonheads"
          ViewProps={viewProps}
        ></PaletteItem>
        <PaletteItem
          component={
            <Component style={{ backgroundColor: "yellow", height: "100%" }} />
          }
          value="Lemonheads"
          ViewProps={viewProps}
        ></PaletteItem>
        <PaletteItem
          component={
            <Component style={{ backgroundColor: "yellow", height: "100%" }} />
          }
          value="Lemonheads"
          ViewProps={viewProps}
        ></PaletteItem>
        <PaletteItem
          component={
            <Component style={{ backgroundColor: "yellow", height: "100%" }} />
          }
          value="Lemonheads"
          ViewProps={viewProps}
        ></PaletteItem>
        <PaletteItem
          component={
            <Component style={{ backgroundColor: "yellow", height: "100%" }} />
          }
          value="Lemonheads"
          ViewProps={viewProps}
        ></PaletteItem>
      </OptionGroup>
    </Palette>
  </View>
);
