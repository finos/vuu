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
import { componentToJson } from "@vuu-ui/vuu-layout";
import { uuid } from "@vuu-ui/vuu-utils";

const AppHeader = (props: HTMLAttributes<HTMLDivElement>) => {
  return <div {...props}>AppHeader</div>;
};
const Toolbar = (props: HTMLAttributes<HTMLDivElement>) => {
  return <div {...props}>Toolbar</div>;
};

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

  const getNewComponent = (): Omit<ComponentTemplate, "label"> => {
    return {
      componentJson: JSON.stringify(
        componentToJson(
          <GridLayout colsAndRows={{ cols: ["1fr"], rows: ["1fr"] }}>
            <GridLayoutItem
              data-drop-target
              header
              id={uuid()}
              resizeable="hv"
              style={{ gridArea: "1/1/2/2" }}
              title="Brown"
            >
              <GridPlaceholder style={{ inset: 0, position: "absolute" }} />
            </GridLayoutItem>
          </GridLayout>,
        ),
      ),
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
