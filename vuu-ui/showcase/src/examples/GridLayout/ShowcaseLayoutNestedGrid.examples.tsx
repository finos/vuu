import { HTMLAttributes, useCallback, useMemo } from "react";
import { GridPalette, GridPaletteItem } from "../html/components/GridPalette";
import {
  ComponentTemplate,
  GridLayout,
  GridLayoutChangeHandler,
  GridLayoutItem,
  GridLayoutProvider,
  GridLayoutStackedItem,
  GridPlaceholder,
} from "@heswell/grid-layout";
import { DebugGridItem } from "../html/components/DebugGridItem";

import "./GridLayout.examples.css";
import { uuid } from "@vuu-ui/vuu-utils";

const AppHeader = (props: HTMLAttributes<HTMLDivElement>) => {
  return <div {...props}>AppHeader</div>;
};
const Toolbar = (props: HTMLAttributes<HTMLDivElement>) => {
  return <div {...props}>Toolbar</div>;
};

export const ShowCaseLayoutNestedGrid = () => {
  // prettier-ignore
  const paletteItems = useMemo<GridPaletteItem[]>(
    () => [
      {
        paletteEntry: {label: "Red", style: { background: "red", color: 'white' }}, 
        component: {label: "Red", type: "DebugGridItem", props: { style: { background: "red" }}}
      },
      {
        paletteEntry: {label: "Green", style: { background: "green", color: 'white' }}, 
        component: {label: "Green", type: "DebugGridItem", props: { style: { background: "green" }}},
      },
      {
        paletteEntry: {label: "Yellow", style: { background: "yellow", color: 'black' }}, 
        component: {label: "Yellow", type: "DebugGridItem", props: { style: { background: "yellow" }}},
      },
      {
        paletteEntry: {label: "Brown", style: { background: "brown", color: 'white' }}, 
        component: {label: "Brown", type: "DebugGridItem", props: { style: { background: "brown" }}},
      },
      {
        paletteEntry: {label: "Blue", style: { background: "green", color: 'white' }}, 
        component: {label: "Blue",type: "DebugGridItem", props: { style: { background: "blue" }}},
      },
      {
        paletteEntry: {label: "Navy", style: { background: "navy", color: 'white' }}, 
        component: {label: "Navy",type: "DebugGridItem", props: { style: { background: "navy" }}},
      },
      {
        paletteEntry: {label: "Gray", style: { background: "gray", color: 'white' }}, 
        component: {label: "Gray", type: "DebugGridItem", props: { style: { background: "gray" }}},
      },
    ],
    [],
  );

  const handleGridLayoutChanged = useCallback<GridLayoutChangeHandler>(() => {
    // console.log(`layout changed for grid ${id}`, {
    //   gridLayout,
    // });
  }, []);

  const getNewComponent = (): Omit<ComponentTemplate, "label"> => {
    const itemId = uuid();
    return {
      componentJson: JSON.stringify({
        children: [
          {
            id: itemId,
            props: {
              "data-drop-target": true,
              header: true,
              resizeable: "hv",
              style: { gridArea: "1/1/2/2" },
              title: "Brown",
            },
            type: "GridLayoutItem",
            children: [
              {
                props: { style: { inset: 0, position: "absolute" } },
                type: "GridPlaceholder",
              },
            ],
          },
        ],
        props: { colsAndRows: { cols: ["1fr"], rows: ["1fr"] } },
        type: "Grid",
      }),
      dropTarget: false,
    };
  };

  return (
    <>
      <div id="dragImage" style={{ position: "absolute", left: 0 }}></div>
      <GridLayoutProvider options={{ newChildItem: { header: true } }}>
        <GridLayout
          full-page
          id="showcase"
          colsAndRows={{
            cols: ["200px", "1fr", "80px"],
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
            <AppHeader style={{ background: "yellow" }} />
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
            <Toolbar style={{ background: "brown", color: "white" }} />
          </GridLayoutItem>
          <GridLayoutStackedItem
            id="main-tabs"
            style={{ gridArea: "3/2/4/3" }}
            allowAddTab
            getNewComponent={getNewComponent}
            showMenu
          />

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
                header
                id="brown"
                resizeable="hv"
                style={{ gridArea: "1/1/2/2" }}
                title="Brown"
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
                resizeable="hv"
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
                resizeable="hv"
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
                resizeable="hv"
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
