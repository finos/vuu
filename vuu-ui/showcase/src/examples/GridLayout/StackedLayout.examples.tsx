import {
  ComponentTemplate,
  GridLayout,
  GridLayoutItem,
  GridLayoutStackedItem,
} from "@heswell/grid-layout";
import { DebugGridItem } from "../html/components/DebugGridItem";

export const SingleStackedItemFillsGrid = () => {
  // prettier-ignore
  return (
    <GridLayout colsAndRows={{ cols: ["1fr"], rows: ["1fr"] }} full-page id="GridLayout1" >
      <GridLayoutItem id="brown" key="brown" title="Brown" stackId="tabs-1"
        data-drop-target  header  resizeable="hv"  style={{ gridArea: "1/1/2/2" }}
      >
        <DebugGridItem style={{ background: "brown" }} />
      </GridLayoutItem>
      <GridLayoutItem id="navy"  key="navy" title="Navy" stackId="tabs-1"
        data-drop-target  header resizeable="hv" style={{ gridArea: "1/1/2/2" }}
      >
        <DebugGridItem style={{ background: "navy" }} />
      </GridLayoutItem>
      <GridLayoutItem id="red" key="red" title="Red" stackId="tabs-1"
        data-drop-target header resizeable="hv"  style={{ gridArea: "1/1/2/2" }}
      >
        <DebugGridItem style={{ background: "red" }} />
      </GridLayoutItem>
      <GridLayoutItem id="yellow" key="yellow" title="Yellow" stackId="tabs-1"
        data-drop-target header resizeable="hv" style={{ gridArea: "1/1/2/2" }}
      >
        <DebugGridItem style={{ background: "yellow" }} />
      </GridLayoutItem>
    </GridLayout>
  );
};

export const SingleStackedItemCustomTabs = () => {
  const getNewComponent = (): ComponentTemplate => {
    return {
      componentJson: JSON.stringify({
        type: "DebugGridItem",
        props: {
          style: {
            background: "pink",
          },
        },
      }),
      label: "Pink",
    };
  };

  // prettier-ignore
  return (
      <GridLayout colsAndRows={{ cols: ["1fr"], rows: ["1fr"] }} full-page id="TopLevelLayout" >
        <GridLayoutStackedItem id="tabs-1" style={{ gridArea: "1/1/2/2" }} allowAddTab getNewComponent={getNewComponent} showMenu />
        <GridLayoutItem id="brown" key="brown" title="Brown" stackId="tabs-1"
          data-drop-target  header  resizeable="hv"
        >
          <DebugGridItem style={{ background: "brown" }} />
        </GridLayoutItem>
        <GridLayoutItem id="navy"  key="navy" title="Navy" stackId="tabs-1"
          data-drop-target  header resizeable="hv"
        >
          <DebugGridItem style={{ background: "navy" }} />
        </GridLayoutItem>
        <GridLayoutItem id="red" key="red" title="Red" stackId="tabs-1"
          data-drop-target header resizeable="hv"
        >
          <DebugGridItem style={{ background: "red" }} />
        </GridLayoutItem>
        <GridLayoutItem id="yellow" key="yellow" title="Yellow" stackId="tabs-1"
          data-drop-target header resizeable="hv"
        >
          <DebugGridItem style={{ background: "yellow" }} />
        </GridLayoutItem>
        </GridLayout>
    );
};
