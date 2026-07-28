import { ECElementEvent } from "echarts";
import { useCallback, useRef, useState } from "react";
import {
  ChartSelectionModel,
  EChartsCallbackParams,
  ItemColorFunction,
  SymbolSizeFunction,
} from "./chart-types";
import { DataSourceValue } from "./ChartSeries";

interface ChartSelectionHookProps {
  selectionModel?: ChartSelectionModel;
  categoryColumnName: string;
}

type DataItem = {
  column: string;
  key: string;
};

const dataItemMatch = (
  dataItem: DataItem | undefined,
  targetSeries: string,
  targetKey: string,
) => dataItem?.column === targetSeries && dataItem?.key === targetKey;
const dataItemInList = (
  dataItems: DataItem[],
  targetColumn: string,
  targetKey: string,
) =>
  dataItems.some((dataItem) =>
    dataItemMatch(dataItem, targetColumn, targetKey),
  );

export const useChartSelection = (_props: ChartSelectionHookProps) => {
  const [selectedKeys, setSelectedKeys] = useState<DataItem[]>([]);
  const [, setHighlightedKey] = useState<DataItem | undefined>();
  const selectedKeysRef = useRef<DataItem[]>(selectedKeys);
  const highlightedKeyRef = useRef<DataItem | undefined>(undefined);

  const handleClick = useCallback(
    ({ data, event, seriesName: column }: ECElementEvent) => {
      if (column) {
        event?.stop();

        const { row } = data as DataSourceValue;
        const key = row[6];

        setSelectedKeys((currentSelection) => {
          return (selectedKeysRef.current = dataItemInList(
            currentSelection,
            column,
            key,
          )
            ? []
            : [{ column, key }]);
        });
      }
    },
    [],
  );

  const handleMouseOver = useCallback(
    ({ data, seriesName }: ECElementEvent) => {
      if (seriesName) {
        const { row } = data as DataSourceValue;
        setHighlightedKey(
          (highlightedKeyRef.current = { column: seriesName, key: row[6] }),
        );
      }
    },
    [],
  );

  const handleMouseOut = useCallback(() => {
    setHighlightedKey((highlightedKeyRef.current = undefined));
  }, []);

  const itemColorFunction = useCallback<ItemColorFunction>(
    ({ color, data, seriesName }) => {
      return dataItemInList(selectedKeysRef.current, seriesName, data.key)
        ? "purple"
        : color;
    },
    [],
  );

  const symbolSizeFunction = useCallback<SymbolSizeFunction>(
    (value: number, { data, seriesName }: EChartsCallbackParams) => {
      const isSelected = dataItemInList(
        selectedKeysRef.current,
        seriesName,
        data.key,
      );
      return isSelected ||
        dataItemMatch(highlightedKeyRef.current, seriesName, data.key)
        ? 16
        : 6;
    },
    [],
  );

  return {
    onClick: handleClick,
    onMouseOver: handleMouseOver,
    onMouseOut: handleMouseOut,
    itemColorFunction,
    symbolSizeFunction,
  };
};
