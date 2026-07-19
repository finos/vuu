import { DataSourceValue } from "./ChartSeries";

export const defaultItemColorFunction: ItemColorFunction = ({ color }) => color;

export type EChartsCallbackParams = {
  color: string;
  data: DataSourceValue;
  dataIndex: number;
  name: string;
  /**
   * This is the Vuu column name
   */
  seriesName: string;
};

export type SymbolSizeFunction = (
  value: number,
  params: EChartsCallbackParams,
) => number | [number, number];
export type SymbolSize = number | [number, number] | SymbolSizeFunction;
export type SymbolType = "emptyCircle" | "circle" | `path://${string}`;

export type ItemColorFunction = (params: EChartsCallbackParams) => string;

export interface SeriesBase {
  data: DataSourceValue[];
  id: string;
  itemStyle?: {
    borderColor?: string;
    color: string | ItemColorFunction;
    borderWidth?: number;
  };
  label: string;
  name: string;
  symbol?: SymbolType;
  symbolSize: SymbolSize;
}

export interface LineSeries extends SeriesBase {
  connectNulls?: boolean;
  lineStyle: {
    color?: string;
    width: number;
  };
  type: "line";
}
export interface ScatterSeries extends SeriesBase {
  type: "scatter";
}

export type Series = LineSeries | ScatterSeries;

export type ChartSelectionModel =
  | "none"
  | "single"
  | "single-no-deselect"
  | "extended";
