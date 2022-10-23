import React from "react";
import { FlexboxLayout as Flexbox, Placeholder, View } from "@vuu-ui/layout";

const fullFlex = { flexBasis: 1, flexGrow: 1, flexShrink: 1 };
const noFlex = { flexGrow: 0, flexShrink: 0 };

export const holyGrail = (
  <Flexbox style={{ flexDirection: "column", ...fullFlex }}>
    <View data-resizeable style={{ flexBasis: 100, ...noFlex }}>
      <Placeholder />
    </View>
    <Flexbox style={{ flexDirection: "row", flex: 1 }}>
      <View data-resizeable style={{ flexBasis: 100, ...noFlex }}>
        <Placeholder />
      </View>
      <View data-resizeable style={{ flex: 1 }}>
        <Placeholder />
      </View>
      <View data-resizeable style={{ flexBasis: 100, ...noFlex }}>
        <Placeholder />
      </View>
    </Flexbox>
    <View>
      <Placeholder />
    </View>
  </Flexbox>
);

export const responsiveExample = (
  <Flexbox
    responsive
    spacing={3}
    cols={12}
    className="show-grid"
    style={{
      flexDirection: "row",
      margin: 20,
      backgroundColor: "#ccc",
    }}
  >
    <div data-xs={12} style={{ backgroundColor: "red", height: 150 }} />
    <Flexbox data-xs={12} cols={12} responsive style={{}}>
      <div data-xs={4} style={{ backgroundColor: "green", minHeight: 300 }} />
      <Flexbox data-xs={8} cols={8} responsive style={{ minHeight: 300 }}>
        <div
          data-xs={8}
          style={{ backgroundColor: "rgba(0,0,255,.3)", minHeight: 50 }}
        />
        <Flexbox data-xs={8} cols={8} responsive style={{}}>
          <div
            data-xs={4}
            style={{ backgroundColor: "green", minHeight: 50 }}
          />
          <div data-xs={4} style={{ backgroundColor: "blue" }} />
        </Flexbox>
        <Flexbox data-xs={8} cols={8} responsive style={{}}>
          <div
            data-xs={4}
            style={{ backgroundColor: "green", minHeight: 50 }}
          />
          <div data-xs={4} style={{ backgroundColor: "blue" }} />
        </Flexbox>
        <Flexbox data-xs={8} cols={8} responsive style={{}}>
          <div
            data-xs={4}
            style={{ backgroundColor: "green", minHeight: 50 }}
          />
          <div data-xs={4} style={{ backgroundColor: "blue" }} />
        </Flexbox>
      </Flexbox>
    </Flexbox>
  </Flexbox>
);

export const twoRows = (
  <Flexbox style={{ flexDirection: "column", ...fullFlex }} resizeable>
    <View data-resizeable style={{ flex: 1 }}>
      <Placeholder />
    </View>
    <View data-resizeable style={{ flex: 1 }}>
      <Placeholder />
    </View>
  </Flexbox>
);

export const threeRows = (
  <Flexbox style={{ flexDirection: "column", ...fullFlex }} resizeable>
    <Placeholder data-resizeable style={{ flex: 1 }} />
    <Placeholder data-resizeable style={{ flex: 1 }} />
    <Placeholder data-resizeable style={{ flex: 1 }} />
  </Flexbox>
);

export const fourRows = (
  <Flexbox style={{ flexDirection: "column", ...fullFlex }} resizeable>
    <Placeholder data-resizeable style={{ flex: 1 }} />
    <Placeholder data-resizeable style={{ flex: 1 }} />
    <Placeholder data-resizeable style={{ flex: 1 }} />
    <Placeholder data-resizeable style={{ flex: 1 }} />
  </Flexbox>
);

export const twoColumns = (
  <Flexbox style={{ flexDirection: "row", ...fullFlex }} resizeable>
    <Placeholder data-resizeable style={{ flex: 1 }} />
    <Placeholder data-resizeable style={{ flex: 1 }} />
  </Flexbox>
);

export const threeColumnsContent = (
  <Flexbox
    style={{
      flexDirection: "row",
      flexBasis: "auto",
      flexGrow: 0,
      flexShrink: 1,
    }}
    resizeable
  >
    <Placeholder
      data-resizeable
      style={{ flex: 0, minWidth: 50, minHeight: 50 }}
    />
    <Placeholder
      data-resizeable
      style={{ flex: 0, minWidth: 50, minHeight: 50 }}
    />
    <Placeholder
      data-resizeable
      style={{ flex: 0, minWidth: 50, minHeight: 50 }}
    />
  </Flexbox>
);

export const threeRowsContent = (
  <Flexbox style={{ flexDirection: "column", ...fullFlex }} resizeable>
    <Placeholder data-resizeable style={{ flex: 0, minHeight: 30 }} />
    <Placeholder data-resizeable style={{ flex: 0, minHeight: 30 }} />
    <Placeholder data-resizeable style={{ flex: 0, minHeight: 30 }} />
  </Flexbox>
);

export const responsive_12_col = (
  <Flexbox
    className="show-grid"
    responsive
    style={{ flexDirection: "row", ...fullFlex }}
  />
);
