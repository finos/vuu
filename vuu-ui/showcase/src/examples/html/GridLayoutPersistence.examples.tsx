import { useMemo } from "react";

import { type LayoutJSON } from "@finos/vuu-utils";
import {
  GridLayout,
  GridLayoutProvider,
  layoutFromJson,
  type SerializedGridLayout,
} from "@heswell/grid-layout";
import "./GridLayout.examples.css";

export const TwoByTwoDoubleRowspanInColumnTwoDeserialized = () => {
  const serializedLayout = useMemo<SerializedGridLayout>(
    // prettier-ignore
    () => ({
      id: "grid-1",
      components: {
        green: {
          type: "div",  props: { style: { background: "green" } } },
        blue: {
          type: "div", props: { style: { background: "blue" } } },
        red: {
          type: "div", props: { style: { background: "red" } } },
      },
      layout: {
        cols: ["1fr", "1fr"],
        rows: ["1fr", "1fr"],
        gridLayoutItems: {
          green: {
            gridArea: "1/1/2/2",
            header: true,
            resizeable: "hv",
            title: "Green",
          },
          blue: {
            gridArea: "1/2/3/3",
            header: true,
            resizeable: "hv",
            title: "Blue",
          },
          red: {
            gridArea: "2/1/3/2",
            header: true,
            resizeable: "hv",
            title: "Red",
          },
        },
      },
    }),
    [],
  );

  return (
    <GridLayoutProvider serializedLayout={serializedLayout}>
      <GridLayout full-page id="grid-1" />
    </GridLayoutProvider>
  );
};

export const SingleStackDeserialized = () => {
  const serializedLayout = useMemo<SerializedGridLayout>(
    // prettier-ignore
    () => ({
      id: "grid-1",
      components: {
        green: {
          type: "div",  props: { style: { background: "green" } } },
        blue: {
          type: "div", props: { style: { background: "blue" } } },
        red: {
          type: "div", props: { style: { background: "red" } } },
        yellow: {
          type: "div", props: { style: { background: "yellow" } } },
      },
      layout: {
        cols: ["1fr"],
        rows: ["1fr","1fr"],
        gridLayoutItems: {
          green: {
            gridArea: "1/1/2/2",
            header: true,
            resizeable: "hv",
            stackId: "tabs-1",
            title: "Green",
          },
          blue: {
            gridArea: "1/1/2/2",
            header: true,
            resizeable: "hv",
            stackId: "tabs-1",
            title: "Blue",
          },
          red: {
            contentVisible: true,
            gridArea: "1/1/2/2",
            header: true,
            resizeable: "hv",
            stackId: "tabs-1",
            title: "Red",
          },
          yellow: {
            gridArea: "2/1/3/2",
            header: true,
            resizeable: "hv",
            title: "Yellow",
          },
        },
      },
    }),
    [],
  );

  return (
    <GridLayoutProvider serializedLayout={serializedLayout}>
      <GridLayout full-page id="grid-1" />
    </GridLayoutProvider>
  );
};

export const GridLayoutFromJSON = () => {
  const layoutJson = useMemo<LayoutJSON>(
    () => ({
      type: "Grid",
      props: {
        "full-page": true,
        layout: {
          cols: ["1fr", "1fr"],
          rows: ["1fr", "1fr"],
          gridLayoutItems: {
            red: {
              gridArea: "1/1/2/2",
              header: true,
              title: "Red",
            },
            green: {
              gridArea: "2/1/3/2",
              header: true,
              title: "Green",
            },
            blue: {
              gridArea: "1/2/3/3",
              header: true,
              title: "Blue",
            },
          },
        },
      },
      children: [
        { type: "div", id: "red", props: { style: { background: "red" } } },
        { type: "div", id: "green", props: { style: { background: "green" } } },
        { type: "div", id: "blue", props: { style: { background: "blue" } } },
      ],
    }),
    [],
  );

  const gridLayout = useMemo(() => {
    return layoutFromJson(layoutJson, "0");
  }, [layoutJson]);

  return gridLayout;
};
