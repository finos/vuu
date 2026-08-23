import { queryClosest } from "@vuu-ui/vuu-utils";
import type { DragEvent } from "react";
import { useCallback } from "react";
import {
  GridLayout,
  GridLayoutItem,
  GridLayoutProvider,
  GridLayoutStackedItem,
  type TemplateSource,
  useDraggable,
  useGridLayoutDragStartHandler,
} from "../../index";

export type GridLayoutFixtureVariant =
  | "basic"
  | "nested"
  | "non-resizable"
  | "palette"
  | "resizable"
  | "stacked";

const itemStyle = {
  alignItems: "center",
  display: "flex",
  height: "100%",
  justifyContent: "center",
};

const TestContent = ({ label }: { label: string }) => (
  <div data-testid={`content-${label.toLowerCase()}`} style={itemStyle}>
    {label}
  </div>
);

const TemplatePalette = () => {
  const onDragStart = useGridLayoutDragStartHandler();
  const getDragSource = useCallback(
    (event: DragEvent<Element>): TemplateSource => {
      const element = queryClosest(
        event.target,
        "[data-testid='palette-item']",
      );
      if (!element) {
        throw Error("TemplatePalette drag source not found");
      }
      const layout = queryClosest(element, ".vuuGridLayout", true);
      return {
        componentJson: JSON.stringify({
          label: "Template",
          props: { "data-testid": "template-content", children: "Template" },
          type: "div",
        }),
        element,
        label: "Template",
        layoutId: layout.id,
        type: "template",
      };
    },
    [],
  );
  const draggable = useDraggable({ getDragSource, onDragStart });

  return (
    <button data-testid="palette-item" draggable type="button" {...draggable}>
      Template
    </button>
  );
};

const BasicLayout = () => (
  <GridLayout
    colsAndRows={{ cols: ["1fr", "1fr"], rows: ["1fr"] }}
    data-testid="grid-layout"
    id="ct-grid"
    style={{ height: 320, width: 640 }}
  >
    <GridLayoutItem
      data-drop-target
      header
      id="alpha"
      resizeable="hv"
      style={{ gridArea: "1/1/2/2" }}
      title="Alpha"
    >
      <TestContent label="Alpha" />
    </GridLayoutItem>
    <GridLayoutItem
      data-drop-target
      header
      id="beta"
      resizeable="hv"
      style={{ gridArea: "1/2/2/3" }}
      title="Beta"
    >
      <TestContent label="Beta" />
    </GridLayoutItem>
  </GridLayout>
);

const PaletteLayout = () => (
  <GridLayout
    colsAndRows={{ cols: ["160px", "1fr"], rows: ["1fr"] }}
    data-testid="grid-layout"
    id="ct-grid"
    style={{ height: 320, width: 640 }}
  >
    <GridLayoutItem id="palette" style={{ gridArea: "1/1/2/2" }}>
      <TemplatePalette />
    </GridLayoutItem>
  </GridLayout>
);

const ResizableLayout = () => (
  <GridLayout
    colsAndRows={{ cols: ["200px", "400px"], rows: ["1fr"] }}
    data-testid="grid-layout"
    id="ct-grid"
    style={{ height: 320, width: 612 }}
  >
    <GridLayoutItem
      data-drop-target
      header
      id="fixed"
      resizeable={false}
      style={{ gridArea: "1/1/2/2" }}
      title="Fixed"
    >
      <TestContent label="Fixed" />
    </GridLayoutItem>
    <GridLayoutItem
      data-drop-target
      header
      id="flexible"
      resizeable="h"
      style={{ gridArea: "1/2/2/3" }}
      title="Flexible"
    >
      <TestContent label="Flexible" />
    </GridLayoutItem>
  </GridLayout>
);

const NonResizableLayout = () => (
  <GridLayout
    colsAndRows={{ cols: ["1fr", "1fr"], rows: ["1fr"] }}
    data-testid="grid-layout"
    id="ct-grid"
    style={{ height: 320, width: 640 }}
  >
    <GridLayoutItem
      id="fixed-left"
      resizeable={false}
      style={{ gridArea: "1/1/2/2" }}
    >
      <TestContent label="Fixed left" />
    </GridLayoutItem>
    <GridLayoutItem
      id="fixed-right"
      resizeable={false}
      style={{ gridArea: "1/2/2/3" }}
    >
      <TestContent label="Fixed right" />
    </GridLayoutItem>
  </GridLayout>
);

const newTabComponent = () => ({
  componentJson: JSON.stringify({
    props: { "data-testid": "new-tab-content", children: "New tab content" },
    type: "div",
  }),
});

const StackedLayout = () => (
  <GridLayout
    colsAndRows={{ cols: ["1fr"], rows: ["1fr"] }}
    data-testid="grid-layout"
    id="ct-grid"
    style={{ height: 320, width: 640 }}
  >
    <GridLayoutStackedItem
      allowAddTab
      getNewComponent={newTabComponent}
      id="main-tabs"
      showMenu
      style={{ gridArea: "1/1/2/2" }}
    />
    <GridLayoutItem
      data-drop-target
      contentVisible
      id="alpha"
      stackId="main-tabs"
      style={{ gridArea: "1/1/2/2" }}
      title="Alpha"
    >
      <TestContent label="Alpha" />
    </GridLayoutItem>
    <GridLayoutItem
      data-drop-target
      contentVisible={false}
      id="beta"
      stackId="main-tabs"
      style={{ gridArea: "1/1/2/2" }}
      title="Beta"
    >
      <TestContent label="Beta" />
    </GridLayoutItem>
  </GridLayout>
);

const NestedLayout = () => (
  <GridLayout
    colsAndRows={{ cols: ["1fr", "1fr"], rows: ["1fr"] }}
    data-testid="grid-layout"
    id="parent-grid"
    style={{ height: 320, width: 640 }}
  >
    <GridLayoutItem
      data-drop-target
      header
      id="nested-owner"
      resizeable="hv"
      style={{ gridArea: "1/1/2/2" }}
      title="Nested owner"
    >
      <GridLayout
        colsAndRows={{ cols: ["1fr"], rows: ["1fr", "1fr"] }}
        data-testid="nested-grid"
        id="nested-grid"
        style={{ height: "100%", width: "100%" }}
      >
        <GridLayoutItem
          data-drop-target
          header
          id="nested-one"
          style={{ gridArea: "1/1/2/2" }}
          title="Nested one"
        >
          <TestContent label="Nested one" />
        </GridLayoutItem>
        <GridLayoutItem
          data-drop-target
          header
          id="nested-two"
          style={{ gridArea: "2/1/3/2" }}
          title="Nested two"
        >
          <TestContent label="Nested two" />
        </GridLayoutItem>
      </GridLayout>
    </GridLayoutItem>
    <GridLayoutItem
      data-drop-target
      header
      id="parent-peer"
      style={{ gridArea: "1/2/2/3" }}
      title="Parent peer"
    >
      <TestContent label="Parent peer" />
    </GridLayoutItem>
  </GridLayout>
);

export const GridLayoutTestFixture = ({
  variant,
}: {
  variant: GridLayoutFixtureVariant;
}) => (
  <GridLayoutProvider options={{ newChildItem: { header: true } }}>
    {variant === "basic" ? <BasicLayout /> : null}
    {variant === "nested" ? <NestedLayout /> : null}
    {variant === "non-resizable" ? <NonResizableLayout /> : null}
    {variant === "palette" ? <PaletteLayout /> : null}
    {variant === "resizable" ? <ResizableLayout /> : null}
    {variant === "stacked" ? <StackedLayout /> : null}
  </GridLayoutProvider>
);
