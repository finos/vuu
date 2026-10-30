import type { DataSource, DataSourceRow } from "@vuu-ui/vuu-data-types";
import type { EChartsCoreOption } from "echarts/core";
import {
  Aggregator,
  filterRows,
  getColumnValue,
  getNumber,
} from "../chart-data/projection-utils";
import {
  type ChartDataLookup,
  type ChartModel,
  GROUP_KEY_SEPARATOR,
  type SeriesRows,
} from "../engine/ChartModel";
import { legendOption, textStyle, tooltipOption } from "../options/common";
import type { ChartTheme } from "../theme/chartTheme";
import type { Aggregation, LegendPosition, RowMatch } from "../vuu-chart-types";

export type HierarchyChartType = "treemap" | "sunburst" | "pie";

/**
 * - 'palette': each top level group is assigned a palette colour
 * - 'sign': node size is the absolute value, colour is up (positive) or
 *    down (negative), e.g. for pnl or long/short exposure
 */
export type HierarchyColorMode = "palette" | "sign";

export interface HierarchyChartOptions {
  /** Default 'sum' */
  aggregation?: Aggregation;
  /** Default 'palette' */
  colorMode?: HierarchyColorMode;
  dataSource: DataSource;
  /**
   * Columns defining the hierarchy, outermost first, e.g. ["sector", "ric"].
   * Pie charts use only the first column.
   */
  groupByColumnNames: string[];
  /** Pie chart only, renders a donut. Default false */
  donut?: boolean;
  /** Formats values in labels and tooltips */
  formatValue?: (value: number) => string;
  /** Pie only, default 'none' */
  legend?: LegendPosition;
  showTooltip?: boolean;
  type: HierarchyChartType;
  /** Column providing the value to be aggregated, e.g "notional" */
  valueColumnName: string;
  where?: RowMatch;
}

export interface HierarchyNode {
  name: string;
  /**
   * size of the node, absolute value in colorMode 'sign'. For parent nodes,
   * the sum of the children's sizes.
   */
  value: number;
  /** aggregated value, which may be negative */
  signedValue: number;
  vuuGroupKey: string;
  itemStyle?: { color: string };
  children?: HierarchyNode[];
}

const defaultFormatValue = (value: number) =>
  Math.abs(value) >= 1000
    ? value.toLocaleString(undefined, { maximumFractionDigits: 0 })
    : value.toLocaleString(undefined, { maximumFractionDigits: 2 });

interface GroupBuilder {
  name: string;
  key: string;
  aggregator: Aggregator;
  rows: DataSourceRow[];
  children?: Map<string, GroupBuilder>;
}

/**
 * Group rows by the given columns (outermost first), aggregating values.
 */
export const buildHierarchy = (
  rows: DataSourceRow[],
  getGroupValue: (row: DataSourceRow, depth: number) => unknown,
  getValue: (row: DataSourceRow) => number | null,
  depth: number,
  aggregation: Aggregation,
): GroupBuilder[] => {
  const root = new Map<string, GroupBuilder>();
  for (const row of rows) {
    const value = getValue(row);
    let level = root;
    let key = "";
    for (let d = 0; d < depth; d++) {
      const name = String(getGroupValue(row, d) ?? "");
      key = d === 0 ? name : `${key}${GROUP_KEY_SEPARATOR}${name}`;
      let group = level.get(name);
      if (group === undefined) {
        group = {
          name,
          key,
          aggregator: new Aggregator(aggregation),
          rows: [],
          children: d < depth - 1 ? new Map() : undefined,
        };
        level.set(name, group);
      }
      group.aggregator.add(value);
      group.rows.push(row);
      if (group.children) {
        level = group.children;
      }
    }
  }
  return Array.from(root.values());
};

export const createHierarchyModel = ({
  aggregation = "sum",
  colorMode = "palette",
  dataSource,
  donut = false,
  formatValue = defaultFormatValue,
  groupByColumnNames,
  legend = "none",
  showTooltip = true,
  type,
  valueColumnName,
  where,
}: HierarchyChartOptions): ChartModel => {
  const depth = type === "pie" ? 1 : Math.max(1, groupByColumnNames.length);
  const seriesId = type;

  const tooltipFormatter = (params: {
    data?: HierarchyNode;
    name: string;
    percent?: number;
    treePathInfo?: Array<{ name: string }>;
  }) => {
    const node = params.data;
    if (!node) {
      return params.name;
    }
    const path = node.vuuGroupKey.split(GROUP_KEY_SEPARATOR).join(" / ");
    const percent =
      params.percent !== undefined ? ` (${params.percent.toFixed(1)}%)` : "";
    return `${path}<br/>${valueColumnName}: <b>${formatValue(node.signedValue)}</b>${percent}`;
  };

  const buildBaseOption = (theme: ChartTheme): EChartsCoreOption => {
    const labelStyle = {
      color: theme.foregroundColor,
      fontFamily: theme.fontFamily,
    };
    const seriesBase = {
      id: seriesId,
      name: valueColumnName,
      type,
      data: [],
    };
    let series: Record<string, unknown>;
    if (type === "treemap") {
      series = {
        ...seriesBase,
        roam: false,
        nodeClick: "zoomToNode",
        top: 8,
        left: 0,
        right: 0,
        bottom: 28,
        visibleMin: 100,
        breadcrumb: {
          show: depth > 1,
          height: 20,
          bottom: 4,
          itemStyle: {
            color: theme.tooltipBackgroundColor,
            borderColor: theme.axisLineColor,
            textStyle: { color: theme.foregroundColor },
          },
        },
        label: {
          show: true,
          ...labelStyle,
          color: "#fff",
          formatter: (p: { name: string; data?: HierarchyNode }) =>
            p.data ? `${p.name}\n${formatValue(p.data.signedValue)}` : p.name,
        },
        upperLabel: { show: depth > 1, height: 18, color: "#fff" },
        itemStyle: { borderColor: theme.backgroundColor, gapWidth: 1 },
        levels: [
          {
            itemStyle: {
              borderColor: theme.backgroundColor,
              borderWidth: 0,
              gapWidth: 2,
            },
            upperLabel: { show: false },
          },
          {
            itemStyle: {
              borderColor: theme.splitLineColor,
              borderWidth: 2,
              gapWidth: 1,
            },
          },
        ],
      };
    } else if (type === "sunburst") {
      series = {
        ...seriesBase,
        radius: ["12%", "95%"],
        sort: "desc",
        nodeClick: "rootToNode",
        label: { ...labelStyle, rotate: "radial", minAngle: 8, color: "#fff" },
        itemStyle: { borderColor: theme.backgroundColor, borderWidth: 1 },
      };
    } else {
      series = {
        ...seriesBase,
        radius: donut ? ["45%", "75%"] : "75%",
        center: ["50%", "52%"],
        label: { ...labelStyle, formatter: "{b}: {d}%" },
        labelLine: { lineStyle: { color: theme.axisLineColor } },
        itemStyle: { borderColor: theme.backgroundColor, borderWidth: 1 },
      };
    }
    return {
      animation: false,
      backgroundColor: theme.backgroundColor,
      color: theme.palette,
      textStyle: textStyle(theme),
      legend: legendOption(theme, type === "pie" ? legend : "none"),
      tooltip: {
        ...tooltipOption(theme, { show: showTooltip, trigger: "item" }),
        formatter: tooltipFormatter,
      },
      series: [series],
    };
  };

  const buildDataOption = (data: ChartDataLookup, theme: ChartTheme) => {
    const { columnMap, rows: allRows } = data.get(dataSource);
    const rows = filterRows(allRows, columnMap, where);
    const groups = buildHierarchy(
      rows,
      (row, d) => getColumnValue(row, columnMap, groupByColumnNames[d]),
      (row) => getNumber(row, columnMap, valueColumnName),
      depth,
      aggregation,
    );
    const groupRows = new Map<string, DataSourceRow[]>();

    const toNode = (group: GroupBuilder): HierarchyNode => {
      groupRows.set(group.key, group.rows);
      const signedValue = group.aggregator.value ?? 0;
      const node: HierarchyNode = {
        name: group.name,
        value: colorMode === "sign" ? Math.abs(signedValue) : signedValue,
        signedValue,
        vuuGroupKey: group.key,
      };
      if (colorMode === "sign") {
        node.itemStyle = {
          color: signedValue < 0 ? theme.downColor : theme.upColor,
        };
      }
      if (group.children) {
        node.children = Array.from(group.children.values()).map(toNode);
        // ECharts sizes nested nodes within their parent, so a parent must be
        // the sum of its children (e.g. gross, not net, exposure in sign mode).
        // The aggregated value is still shown in labels and tooltips.
        node.value = node.children.reduce((sum, child) => sum + child.value, 0);
      }
      return node;
    };

    const nodes = groups
      .map(toNode)
      .sort((n1, n2) => Math.abs(n2.value) - Math.abs(n1.value));

    const rowLookup: Record<string, SeriesRows> = {
      [seriesId]: { dataSource, rows: [], groups: groupRows },
    };
    return {
      option: { series: [{ id: seriesId, data: nodes }] },
      rowLookup,
    };
  };

  return { buildBaseOption, buildDataOption, dataSources: [dataSource] };
};
