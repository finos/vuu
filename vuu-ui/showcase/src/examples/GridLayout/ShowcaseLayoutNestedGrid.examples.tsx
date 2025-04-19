import { useCallback, useMemo } from "react";
import { GridPalette, GridPaletteItem } from "../html/components/GridPalette";
import {
  GridLayout,
  GridLayoutChangeHandler,
  GridLayoutItem,
  GridLayoutProvider,
} from "@heswell/grid-layout";
import { DebugGridItem } from "../html/components/DebugGridItem";

import "./GridLayout.examples.css";

export const ShowCaseLayoutNestedGrid = () => {
  const paletteItems = useMemo<GridPaletteItem[]>(
    () => [
      {
        label: "Red",
        type: "DebugGridItem",
        props: {
          style: {
            background: "red",
          },
        },
      },
      {
        label: "Green",
        type: "DebugGridItem",
        props: {
          style: {
            background: "green",
          },
        },
      },
      {
        label: "Yellow",
        type: "DebugGridItem",
        props: {
          style: {
            background: "yellow",
          },
        },
      },
      {
        label: "Brown",
        type: "DebugGridItem",
        props: {
          debugLabel: "Brown",
          style: {
            background: "brown",
          },
        },
      },
    ],
    [],
  );

  const handleGridLayoutChanged = useCallback<GridLayoutChangeHandler>(() => {
    // console.log(`layout changed for grid ${id}`, {
    //   gridLayout,
    // });
  }, []);

  return (
    <>
      <div id="dragImage" style={{ position: "absolute", left: 0 }}></div>
      <GridLayoutProvider options={{ newChildItem: { header: true } }}>
        <GridLayout
          full-page
          id="showcase"
          colsAndRows={{
            cols: ["200px", "1fr", "200px"],
            rows: ["48px", "40px", "1fr"],
          }}
          onChange={handleGridLayoutChanged}
        >
          <GridLayoutItem
            id="app-header"
            style={{
              gridArea: "1/1/2/4",
            }}
          >
            <div style={{ background: "yellow" }}>AppHeader</div>
          </GridLayoutItem>
          <GridLayoutItem
            id="palette"
            resizeable="hv"
            style={{
              gridArea: "2/1/4/2",
            }}
          >
            <GridPalette paletteItems={paletteItems} />
          </GridLayoutItem>

          <GridLayoutItem
            id="app-toolbar"
            resizeable="h"
            style={{
              gridArea: "2/2/3/3",
            }}
          >
            <div style={{ background: "brown", color: "white" }}>Toolbar</div>
          </GridLayoutItem>

          <GridLayoutItem
            id="LayoutBrown"
            stackId="main-tabs"
            style={{ gridArea: "3/2/4/3" }}
            title="Brown Layout"
          >
            <GridLayout
              id="brown-layout"
              colsAndRows={{ cols: ["1fr"], rows: ["1fr"] }}
              title="Brown Layout"
            >
              <GridLayoutItem
                data-drop-target
                id="brown"
                resizeable="hv"
                style={{ gridArea: "1/1/2/2" }}
              >
                <DebugGridItem
                  style={{
                    background: "brown",
                  }}
                />
              </GridLayoutItem>
            </GridLayout>
          </GridLayoutItem>
          <GridLayoutItem
            id="LayoutNavy"
            stackId="main-tabs"
            style={{ gridArea: "3/2/4/3" }}
            title="Navy Layout"
          >
            <GridLayout
              id="navy-layout"
              colsAndRows={{
                cols: ["1fr"],
                rows: ["1fr"],
              }}
              title="Navy Layout"
            >
              <GridLayoutItem
                data-drop-target
                id="navy"
                style={{
                  gridArea: "1/1/2/2",
                }}
              >
                <DebugGridItem
                  style={{
                    background: "navy",
                  }}
                />
              </GridLayoutItem>
            </GridLayout>
          </GridLayoutItem>
          <GridLayoutItem
            id="LayoutGray"
            stackId="main-tabs"
            style={{ gridArea: "3/2/4/3" }}
            title="Gray Layout"
          >
            <GridLayout
              id="gray-layout"
              colsAndRows={{
                cols: ["1fr"],
                rows: ["1fr"],
              }}
              title="Gray Layout"
            >
              <GridLayoutItem
                data-drop-target
                id="gray"
                style={{
                  gridArea: "1/1/2/2",
                }}
              >
                <DebugGridItem
                  style={{
                    background: "darkgray",
                  }}
                />
              </GridLayoutItem>
            </GridLayout>
          </GridLayoutItem>
          <GridLayoutItem
            id="LayoutBlack"
            stackId="main-tabs"
            style={{ gridArea: "3/2/4/3" }}
            title="Black Layout"
          >
            <GridLayout
              id="black-layout"
              colsAndRows={{
                cols: ["1fr"],
                rows: ["1fr"],
              }}
              title="Black Layout"
            >
              <GridLayoutItem
                data-drop-target
                id="black"
                style={{
                  gridArea: "1/1/2/2",
                }}
              >
                <DebugGridItem
                  style={{
                    background: "black",
                    color: "white",
                  }}
                />
              </GridLayoutItem>
            </GridLayout>
          </GridLayoutItem>
        </GridLayout>
      </GridLayoutProvider>
    </>
  );
};
