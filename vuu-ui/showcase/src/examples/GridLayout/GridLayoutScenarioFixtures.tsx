import {
  GridLayout,
  type GridLayoutChangeHandler,
  type GridResizeDistribution,
  GridLayoutItem,
  GridLayoutProvider,
  type TrackSize,
} from "@heswell/grid-layout";
import type { GridLayoutItemProps } from "@heswell/grid-layout/src/GridLayoutItem";
import type { CSSProperties, ReactElement, ReactNode } from "react";

export type ScenarioItem = {
  area: string;
  color: string;
  contentVisible?: boolean;
  dropTarget?: boolean;
  header?: boolean;
  id: string;
  minHeight?: number;
  minWidth?: number;
  resizeable?: "h" | "hv" | "v" | false;
  stackId?: string;
  title?: string;
};

type ScenarioFrameProps = {
  children: ReactNode;
  instructions: string;
  limitation?: string;
  title: string;
};

export const ScenarioFrame = ({
  children,
  instructions,
  limitation,
  title,
}: ScenarioFrameProps) => (
  <div className="gridLayoutScenario">
    <header className="gridLayoutScenario-header">
      <strong>{title}</strong>
      <span>{instructions}</span>
      {limitation ? (
        <span className="gridLayoutScenario-limitation">
          Known limitation: {limitation}
        </span>
      ) : null}
    </header>
    <div className="gridLayoutScenario-content">{children}</div>
  </div>
);

export const createScenarioItem = ({
  area,
  color,
  contentVisible,
  dropTarget = true,
  header = true,
  id,
  minHeight,
  minWidth,
  resizeable = "hv",
  stackId,
  title = id,
}: ScenarioItem): ReactElement<GridLayoutItemProps> => (
  <GridLayoutItem
    contentVisible={contentVisible}
    data-drop-target={dropTarget}
    header={header}
    id={id}
    key={id}
    minHeight={minHeight}
    minWidth={minWidth}
    resizeable={resizeable}
    stackId={stackId}
    style={{ gridArea: area }}
    title={title}
  >
    <div
      className="gridLayoutScenario-item"
      style={{ "--scenario-color": color } as CSSProperties}
    >
      <strong>{title}</strong>
      <code>{area}</code>
    </div>
  </GridLayoutItem>
);

type ScenarioGridProps = {
  children?: ReactElement<GridLayoutItemProps>[];
  cols: TrackSize[];
  id: string;
  onChange?: GridLayoutChangeHandler;
  rowResizeDistribution?: GridResizeDistribution;
  rows: TrackSize[];
};

export const ScenarioGrid = ({
  children,
  cols,
  id,
  onChange,
  rowResizeDistribution,
  rows,
}: ScenarioGridProps) => (
  <GridLayoutProvider options={{ newChildItem: { header: true } }}>
    <GridLayout
      colsAndRows={{ cols, rows }}
      id={id}
      onChange={onChange}
      rowResizeDistribution={rowResizeDistribution}
      style={{ height: "100%", minHeight: 0, width: "100%" }}
    >
      {children}
    </GridLayout>
  </GridLayoutProvider>
);

export const paletteItems = [
  {
    component: {
      label: "Coral",
      props: {
        children: "Coral template",
        style: {
          alignItems: "center",
          background: "coral",
          display: "flex",
          height: "100%",
          justifyContent: "center",
        },
      },
      type: "div",
    },
    paletteEntry: {
      label: "Coral",
      style: { background: "coral", color: "#111" },
    },
  },
  {
    component: {
      label: "Teal",
      props: {
        children: "Teal template",
        style: {
          alignItems: "center",
          background: "teal",
          color: "white",
          display: "flex",
          height: "100%",
          justifyContent: "center",
        },
      },
      type: "div",
    },
    paletteEntry: {
      label: "Teal",
      style: { background: "teal", color: "white" },
    },
  },
] as const;
