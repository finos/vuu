import {
  GridLayout,
  GridLayoutDescriptor,
  GridLayoutProvider,
  layoutFromJson,
  SerializedGridLayout,
  Stack,
} from "@finos/vuu-layout";
import { useMemo, useState } from "react";

import "./GridLayout.examples.css";
import { LayoutJSON } from "@finos/vuu-utils";

export const TwoByTwoDoubleRowspanInColumnTwoJsonLayout = () => {
  const layout = useMemo<GridLayoutDescriptor>(
    () => ({
      cols: ["1fr", "1fr"],
      rows: ["1fr", "1fr"],
      gridLayoutItems: [
        {
          componentId: "green",
          gridArea: "1/1/2/2",
          header: true,
          // resizeable: "hv",
          title: "Green",
        },
        {
          componentId: "blue",
          gridArea: "1/2/3/3",
          header: true,
          // resizeable: "hv",
          title: "Blue",
        },
        {
          componentId: "red",
          gridArea: "2/1/3/2",
          header: true,
          // resizeable: "hv",
          title: "Red",
        },
      ],
    }),
    [],
  );

  return (
    <GridLayout full-page layout={layout}>
      <div id="green" style={{ background: "green" }} />
      <div id="blue" style={{ background: "blue" }} />
      <div id="red" style={{ background: "red" }} />
    </GridLayout>
  );
};

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

export const TwoByTwoDoubleRowspanInColumnTwoSerialized = () => {
  const layout = useMemo<GridLayoutDescriptor>(
    () => ({
      cols: ["1fr", "1fr"],
      rows: ["1fr", "1fr"],
      gridLayoutItems: [
        {
          componentId: "green",
          gridArea: "1/1/2/2",
          header: true,
          resizeable: "hv",
          title: "Green",
        },
        {
          componentId: "blue",
          gridArea: "1/2/3/3",
          header: true,
          resizeable: "hv",
        },
        {
          componentId: "red",
          gridArea: "2/1/3/2",
          header: true,
          resizeable: "hv",
        },
      ],
    }),
    [],
  );

  return (
    <GridLayout full-page layout={layout}>
      <div id="green" style={{ background: "green" }} />
      <div id="blue" style={{ background: "blue" }} />
      <div id="red" style={{ background: "red" }} />
    </GridLayout>
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

const layoutJson1 = {
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
        },
        green: {
          gridArea: "2/1/3/2",
        },
        blue: {
          gridArea: "1/2/3/3",
        },
      },
    },
  },
  children: [
    {
      type: "div",
      id: "red",
      props: { style: { background: "red" } },
    },
    {
      type: "div",
      id: "green",
      props: { style: { background: "green" } },
    },
    {
      type: "div",
      id: "blue",
      props: { style: { background: "blue" } },
    },
  ],
};

const layoutJson2 = {
  type: "Grid",
  props: {
    "full-page": true,
    layout: {
      cols: ["1fr", "1fr"],
      rows: ["1fr", "1fr"],
      gridLayoutItems: {
        red: {
          gridArea: "1/2/2/3",
          header: true,
        },
        green: {
          gridArea: "2/2/3/3",
        },
        blue: {
          gridArea: "1/1/3/2",
        },
      },
    },
  },
  children: [
    {
      type: "div",
      id: "red",
      props: { style: { background: "red" } },
    },
    {
      type: "div",
      id: "green",
      props: { style: { background: "green" } },
    },
    {
      type: "div",
      id: "blue",
      props: { style: { background: "blue" } },
    },
  ],
};

export const GridLayoutFromJSONTabbed = () => {
  const [gridLayout1, gridLayout2] = useMemo(() => {
    return [layoutFromJson(layoutJson1, "0"), layoutFromJson(layoutJson2, "0")];
  }, []);
  const [active, setActive] = useState(0);

  return (
    <Stack
      active={active}
      onTabSelectionChanged={setActive}
      style={{ height: "100vh", width: "100vw" }}
    >
      {gridLayout1}
      {gridLayout2}
    </Stack>
  );
};

export const GridLayoutFromJSONTabbedLayoutProvider = () => {
  const [gridLayout1, gridLayout2] = useMemo(() => {
    return [layoutFromJson(layoutJson1, "0"), layoutFromJson(layoutJson2, "0")];
  }, []);
  const [active, setActive] = useState(0);

  return (
    <GridLayoutProvider>
      <Stack
        active={active}
        onTabSelectionChanged={setActive}
        style={{ height: "100vh", width: "100vw" }}
      >
        {gridLayout1}
        {gridLayout2}
      </Stack>
    </GridLayoutProvider>
  );
};
