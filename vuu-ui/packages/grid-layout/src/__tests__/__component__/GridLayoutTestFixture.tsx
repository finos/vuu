import { queryClosest } from "@vuu-ui/vuu-utils";
import type { DragEvent } from "react";
import { useCallback, useState } from "react";
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
  | "change-rerender"
  | "irregular-removal"
  | "mixed-resizable-boundary"
  | "nested"
  | "nested-palette"
  | "nested-palette-tabs"
  | "non-resizable"
  | "palette"
  | "palette-target"
  | "proportional"
  | "proportional-coupled"
  | "proportional-minimums"
  | "proportional-unequal"
  | "resizable"
  | "resizable-vertical"
  | "split-constraints"
  | "stacked"
  | "stacked-target";

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
        "[data-testid^='palette-item-']",
      );
      if (!element) {
        throw Error("TemplatePalette drag source not found");
      }
      const layout = queryClosest(element, ".vuuGridLayout", true);
      const label = element.dataset.label ?? "Template";
      return {
        componentJson: JSON.stringify({
          label,
          props: { "data-testid": "template-content", children: label },
          type: "div",
        }),
        element,
        label,
        layoutId: layout.id,
        type: "template",
      };
    },
    [],
  );
  const draggable = useDraggable({ getDragSource, onDragStart });

  return (
    <>
      {["Template A", "Template B"].map((label, index) => (
        <button
          data-label={label}
          data-testid={`palette-item-${index + 1}`}
          draggable
          key={label}
          type="button"
          {...draggable}
        >
          {label}
        </button>
      ))}
    </>
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

const ChangeRerenderLayout = () => {
  const [, setChangeCount] = useState(0);

  return (
    <GridLayout
      colsAndRows={{ cols: ["1fr", "1fr"], rows: ["1fr"] }}
      data-testid="grid-layout"
      id="change-rerender-grid"
      onChange={() => setChangeCount((count) => count + 1)}
      style={{ height: 320, width: 640 }}
    >
      <GridLayoutItem
        data-drop-target
        header
        id="rerender-alpha"
        resizeable="hv"
        style={{ gridArea: "1/1/2/2" }}
        title="Alpha"
      >
        <TestContent label="Rerender Alpha" />
      </GridLayoutItem>
      <GridLayoutItem
        data-drop-target
        header
        id="rerender-beta"
        resizeable="hv"
        style={{ gridArea: "1/2/2/3" }}
        title="Beta"
      >
        <TestContent label="Rerender Beta" />
      </GridLayoutItem>
    </GridLayout>
  );
};

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

const PaletteTargetLayout = () => (
  <GridLayout
    colsAndRows={{ cols: ["160px", "1fr"], rows: ["1fr"] }}
    data-testid="grid-layout"
    id="ct-grid"
    style={{ height: 320, width: 640 }}
  >
    <GridLayoutItem id="palette" style={{ gridArea: "1/1/2/2" }}>
      <TemplatePalette />
    </GridLayoutItem>
    <GridLayoutItem
      data-drop-target
      header
      id="palette-target"
      resizeable="hv"
      style={{ gridArea: "1/2/2/3" }}
      title="Drop target"
    >
      <TestContent label="Drop target" />
    </GridLayoutItem>
  </GridLayout>
);

const ResizableLayout = () => (
  <GridLayout
    colsAndRows={{ cols: ["1fr", "2fr"], rows: ["1fr"] }}
    data-testid="grid-layout"
    id="ct-grid"
    style={{ height: 320, width: 612 }}
  >
    <GridLayoutItem
      data-drop-target
      header
      id="fixed"
      minWidth={150}
      resizeable="h"
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

const MixedResizableBoundaryLayout = () => (
  <GridLayout
    colsAndRows={{ cols: ["200px", "400px"], rows: ["100px", "200px"] }}
    data-testid="grid-layout"
    id="ct-grid"
    style={{ height: 312, width: 612 }}
  >
    <GridLayoutItem id="nav" resizeable="hv" style={{ gridArea: "1/1/3/2" }}>
      <TestContent label="Nav" />
    </GridLayoutItem>
    <GridLayoutItem id="toolbar" resizeable="h" style={{ gridArea: "1/2/2/3" }}>
      <TestContent label="Toolbar" />
    </GridLayoutItem>
    <GridLayoutItem
      id="content"
      resizeable={false}
      style={{ gridArea: "2/2/3/3" }}
    >
      <TestContent label="Content" />
    </GridLayoutItem>
  </GridLayout>
);

const VerticalResizableLayout = () => (
  <GridLayout
    colsAndRows={{ cols: ["1fr"], rows: ["1fr", "2fr"] }}
    data-testid="grid-layout"
    id="ct-grid"
    style={{ height: 612, width: 640 }}
  >
    <GridLayoutItem
      data-drop-target
      header
      id="top"
      resizeable="v"
      style={{ gridArea: "1/1/2/2", minHeight: "120px" }}
      title="Top"
    >
      <TestContent label="Top" />
    </GridLayoutItem>
    <GridLayoutItem
      data-drop-target
      header
      id="bottom"
      resizeable="v"
      style={{ gridArea: "2/1/3/2" }}
      title="Bottom"
    >
      <TestContent label="Bottom" />
    </GridLayoutItem>
  </GridLayout>
);

const ProportionalLayout = ({
  constrained = false,
  unequal = false,
}: {
  constrained?: boolean;
  unequal?: boolean;
}) => (
  <GridLayout
    colsAndRows={{
      cols: ["1fr", "1fr"],
      rows: unequal ? ["1fr", "1fr", "2fr"] : ["1fr", "1fr", "1fr"],
    }}
    data-testid="grid-layout"
    id="ct-grid"
    rowResizeDistribution="proportional"
    style={{ height: 600, width: 640 }}
  >
    <GridLayoutItem
      id="proportional-header"
      resizeable="v"
      style={{ gridArea: "1/1/2/3" }}
    >
      <TestContent label="Header" />
    </GridLayoutItem>
    <GridLayoutItem
      id="proportional-middle"
      minHeight={constrained ? 160 : undefined}
      resizeable="v"
      style={{ gridArea: "2/1/3/2" }}
    >
      <TestContent label="Middle" />
    </GridLayoutItem>
    <GridLayoutItem
      id="proportional-bottom"
      resizeable="v"
      style={{ gridArea: "3/1/4/2" }}
    >
      <TestContent label="Bottom" />
    </GridLayoutItem>
    <GridLayoutItem
      id="proportional-span"
      resizeable="v"
      style={{ gridArea: "2/2/4/3" }}
    >
      <TestContent label="Span" />
    </GridLayoutItem>
  </GridLayout>
);

const CoupledProportionalLayout = () => (
  <GridLayout
    colsAndRows={{
      cols: ["1fr", "1fr"],
      rows: ["100px", "100px", "100px", "100px"],
    }}
    data-testid="grid-layout"
    id="ct-grid"
    rowResizeDistribution="proportional"
    style={{ height: 400, width: 640 }}
  >
    <GridLayoutItem
      id="coupled-before"
      resizeable="v"
      style={{ gridArea: "1/1/3/2" }}
    >
      <TestContent label="Before" />
    </GridLayoutItem>
    <GridLayoutItem
      id="coupled-after"
      resizeable="v"
      style={{ gridArea: "3/1/5/2" }}
    >
      <TestContent label="After" />
    </GridLayoutItem>
    <GridLayoutItem
      id="coupled-top"
      resizeable="v"
      style={{ gridArea: "1/2/2/3" }}
    >
      <TestContent label="Top" />
    </GridLayoutItem>
    <GridLayoutItem
      id="coupled-crossing"
      minHeight={190}
      resizeable="v"
      style={{ gridArea: "2/2/4/3" }}
    >
      <TestContent label="Crossing" />
    </GridLayoutItem>
    <GridLayoutItem
      id="coupled-bottom"
      resizeable="v"
      style={{ gridArea: "4/2/5/3" }}
    >
      <TestContent label="Bottom" />
    </GridLayoutItem>
  </GridLayout>
);

const IrregularRemovalLayout = () => (
  <GridLayout
    colsAndRows={{ cols: ["1fr", "1fr", "1fr"], rows: ["1fr", "1fr", "1fr"] }}
    data-testid="grid-layout"
    id="ct-grid"
    style={{ height: 320, width: 640 }}
  >
    <GridLayoutItem id="survivor" style={{ gridArea: "1/1/4/2" }}>
      <TestContent label="Survivor" />
    </GridLayoutItem>
    <GridLayoutItem
      header
      id="removed"
      style={{ gridArea: "1/2/4/4" }}
      title="Removed"
    >
      <TestContent label="Removed" />
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

const SplitConstraintsLayout = () => (
  <GridLayout
    colsAndRows={{ cols: ["1fr", "1fr"], rows: ["1fr"] }}
    data-testid="grid-layout"
    id="ct-grid"
    style={{ height: 320, width: 640 }}
  >
    <GridLayoutItem
      data-drop-target
      header
      id="movable"
      resizeable="hv"
      style={{ gridArea: "1/1/2/2" }}
      title="Movable"
    >
      <TestContent label="Movable" />
    </GridLayoutItem>
    <GridLayoutItem
      data-drop-target
      header
      id="locked"
      resizeable={false}
      style={{ gridArea: "1/2/2/3" }}
      title="Locked"
    >
      <TestContent label="Locked" />
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

const StackedTargetLayout = () => (
  <GridLayout
    colsAndRows={{ cols: ["1fr", "1fr"], rows: ["1fr"] }}
    data-testid="grid-layout"
    id="ct-grid"
    style={{ height: 320, width: 640 }}
  >
    <GridLayoutStackedItem id="main-tabs" style={{ gridArea: "1/1/2/2" }} />
    <GridLayoutItem
      contentVisible
      data-drop-target
      id="alpha"
      stackId="main-tabs"
      style={{ gridArea: "1/1/2/2" }}
      title="Alpha"
    >
      <TestContent label="Alpha" />
    </GridLayoutItem>
    <GridLayoutItem
      contentVisible={false}
      data-drop-target
      id="beta"
      stackId="main-tabs"
      style={{ gridArea: "1/1/2/2" }}
      title="Beta"
    >
      <TestContent label="Beta" />
    </GridLayoutItem>
    <GridLayoutItem
      data-drop-target
      header
      id="target"
      resizeable="hv"
      style={{ gridArea: "1/2/2/3" }}
      title="Target"
    >
      <TestContent label="Target" />
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
          resizeable="hv"
          style={{ gridArea: "1/1/2/2" }}
          title="Nested one"
        >
          <TestContent label="Nested one" />
        </GridLayoutItem>
        <GridLayoutItem
          data-drop-target
          header
          id="nested-two"
          resizeable="hv"
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
      resizeable="hv"
      style={{ gridArea: "1/2/2/3" }}
      title="Parent peer"
    >
      <TestContent label="Parent peer" />
    </GridLayoutItem>
  </GridLayout>
);

const NestedPaletteLayout = () => (
  <GridLayout
    colsAndRows={{ cols: ["160px", "1fr"], rows: ["1fr"] }}
    data-testid="grid-layout"
    id="parent-grid"
    style={{ height: 320, width: 640 }}
  >
    <GridLayoutItem id="palette" style={{ gridArea: "1/1/2/2" }}>
      <TemplatePalette />
    </GridLayoutItem>
    <GridLayoutItem id="nested-owner" style={{ gridArea: "1/2/2/3" }}>
      <GridLayout
        colsAndRows={{ cols: ["1fr"], rows: ["1fr", "1fr"] }}
        data-testid="nested-grid"
        id="nested-grid"
        style={{ height: "100%", width: "100%" }}
      >
        <GridLayoutItem
          data-drop-target
          header
          id="nested-target"
          resizeable="hv"
          style={{ gridArea: "1/1/2/2" }}
          title="Nested target"
        >
          <TestContent label="Nested target" />
        </GridLayoutItem>
        <GridLayoutStackedItem
          id="nested-tabs"
          style={{ gridArea: "2/1/3/2" }}
        />
        <GridLayoutItem
          contentVisible
          data-drop-target
          id="nested-alpha"
          stackId="nested-tabs"
          style={{ gridArea: "2/1/3/2" }}
          title="Nested Alpha"
        >
          <TestContent label="Nested Alpha" />
        </GridLayoutItem>
        <GridLayoutItem
          contentVisible={false}
          data-drop-target
          id="nested-beta"
          stackId="nested-tabs"
          style={{ gridArea: "2/1/3/2" }}
          title="Nested Beta"
        >
          <TestContent label="Nested Beta" />
        </GridLayoutItem>
      </GridLayout>
    </GridLayoutItem>
  </GridLayout>
);

const NestedPaletteTabsLayout = () => (
  <GridLayout
    colsAndRows={{ cols: ["160px", "1fr"], rows: ["1fr"] }}
    data-testid="grid-layout"
    id="parent-grid"
    style={{ height: 320, width: 640 }}
  >
    <GridLayoutItem id="palette" style={{ gridArea: "1/1/2/2" }}>
      <TemplatePalette />
    </GridLayoutItem>
    <GridLayoutStackedItem id="layout-tabs" style={{ gridArea: "1/2/2/3" }} />
    <GridLayoutItem
      contentVisible
      id="brown-layout-owner"
      stackId="layout-tabs"
      style={{ gridArea: "1/2/2/3" }}
      title="Brown Layout"
    >
      <GridLayout
        colsAndRows={{ cols: ["1fr"], rows: ["1fr"] }}
        id="brown-layout"
        style={{ height: "100%", width: "100%" }}
      >
        <GridLayoutItem
          data-drop-target
          id="brown"
          resizeable="hv"
          style={{ gridArea: "1/1/2/2" }}
        >
          <TestContent label="Brown" />
        </GridLayoutItem>
      </GridLayout>
    </GridLayoutItem>
    <GridLayoutItem
      contentVisible={false}
      id="navy-layout-owner"
      stackId="layout-tabs"
      style={{ gridArea: "1/2/2/3" }}
      title="Navy Layout"
    >
      <GridLayout
        colsAndRows={{ cols: ["1fr"], rows: ["1fr"] }}
        id="navy-layout"
        style={{ height: "100%", width: "100%" }}
      >
        <GridLayoutItem
          data-drop-target
          id="navy"
          resizeable="hv"
          style={{ gridArea: "1/1/2/2" }}
        >
          <TestContent label="Navy" />
        </GridLayoutItem>
      </GridLayout>
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
    {variant === "change-rerender" ? <ChangeRerenderLayout /> : null}
    {variant === "irregular-removal" ? <IrregularRemovalLayout /> : null}
    {variant === "mixed-resizable-boundary" ? (
      <MixedResizableBoundaryLayout />
    ) : null}
    {variant === "nested" ? <NestedLayout /> : null}
    {variant === "nested-palette" ? <NestedPaletteLayout /> : null}
    {variant === "nested-palette-tabs" ? <NestedPaletteTabsLayout /> : null}
    {variant === "non-resizable" ? <NonResizableLayout /> : null}
    {variant === "palette" ? <PaletteLayout /> : null}
    {variant === "palette-target" ? <PaletteTargetLayout /> : null}
    {variant === "proportional" ? <ProportionalLayout /> : null}
    {variant === "proportional-coupled" ? <CoupledProportionalLayout /> : null}
    {variant === "proportional-minimums" ? (
      <ProportionalLayout constrained />
    ) : null}
    {variant === "proportional-unequal" ? <ProportionalLayout unequal /> : null}
    {variant === "resizable" ? <ResizableLayout /> : null}
    {variant === "resizable-vertical" ? <VerticalResizableLayout /> : null}
    {variant === "split-constraints" ? <SplitConstraintsLayout /> : null}
    {variant === "stacked" ? <StackedLayout /> : null}
    {variant === "stacked-target" ? <StackedTargetLayout /> : null}
  </GridLayoutProvider>
);
