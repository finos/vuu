import { ColumnGroupType } from "../grid-model/gridModelTypes";
import { Reducer } from "react";
import { KeyedColumnDescriptor } from "@finos/vuu-datagrid-types";

const VIRTUALIZATION_THRESHOLD = 0.66;

export const initCanvasReducer = (
  columnGroup: ColumnGroupType
): CanvasState => {
  const renderColumns = getRenderColumns(columnGroup);
  return [renderColumns, initialKeys(renderColumns), columnGroup, 0];
};

export interface CanvasActionScrollLeft {
  type: "scroll-left";
  scrollLeft: number;
}
export interface CanvasActionRefresh {
  type: "refresh";
  columnGroup: ColumnGroupType;
}

export type CanvasAction = CanvasActionRefresh | CanvasActionScrollLeft;

export type CanvasState = [
  KeyedColumnDescriptor[],
  Map<number, number>,
  ColumnGroupType,
  number
];

export type CanvasReducer = Reducer<CanvasState, CanvasAction>;

export const canvasReducer: CanvasReducer = (state, action) => {
  const [, keys, columnGroup, scrollLeft] = state;
  switch (action.type) {
    case "scroll-left": {
      const nextColumns = getRenderColumns(columnGroup, action.scrollLeft);
      return [
        nextColumns,
        nextKeys(nextColumns, keys),
        columnGroup,
        action.scrollLeft,
      ];
    }
    case "refresh": {
      const nextColumns = getRenderColumns(action.columnGroup, scrollLeft);
      return [
        nextColumns,
        nextKeys(nextColumns, keys),
        action.columnGroup,
        scrollLeft,
      ];
    }
    default:
      return state;
  }
};

function initialKeys(columns: KeyedColumnDescriptor[]) {
  return new Map(columns.map((column, idx) => [column.key, idx]));
}

function nextKeys(
  columns: KeyedColumnDescriptor[],
  prevKeys: Map<number, number>
): Map<number, number> {
  if (columns.every(({ key }) => prevKeys.has(key))) {
    return prevKeys;
  } else {
    const remainingKeys = new Map(prevKeys);
    const nextKeys = new Map();
    const columnsAwaitingKeys: number[] = [];

    const nextKey = () => {
      const usedKeys = new Map(
        Array.from(initialKeys(columns).entries()).map(([k, v]) => [v, k])
      );

      nextKeys.forEach((value) => {
        if (usedKeys.has(value)) {
          usedKeys.delete(value);
        }
      });

      if (usedKeys.size > 0) {
        return usedKeys.keys().next().value;
      } else {
        return columns.length;
      }
    };

    columns.forEach((column) => {
      if (remainingKeys.has(column.key)) {
        nextKeys.set(column.key, remainingKeys.get(column.key));
        remainingKeys.delete(column.key);
      } else {
        columnsAwaitingKeys.push(column.key);
      }
    });

    const freeKeys = Array.from(remainingKeys.values());
    columnsAwaitingKeys.forEach((columnKey) => {
      nextKeys.set(columnKey, freeKeys.length ? freeKeys.shift() : nextKey());
    });

    return nextKeys;
  }
}

function getRenderColumns(
  columnGroup: ColumnGroupType,
  scrollLeft = 0
): KeyedColumnDescriptor[] {
  if (!isVirtualizationRequired(columnGroup)) {
    return columnGroup.columns;
  }
  const { columns, width } = columnGroup;
  let firstIdx = -1;
  let lastIdx = columns.length - 1;
  let offset = 0;
  const defaultWidth = 200;

  for (let i = 0, currentPosition = 0; i < columns.length; i++) {
    currentPosition += columns[i].width || defaultWidth;
    if (currentPosition <= scrollLeft) {
      offset += columns[i].width ?? defaultWidth;
    } else if (currentPosition > scrollLeft + width) {
      lastIdx = i;
      break;
    } else if (firstIdx === -1 && currentPosition > scrollLeft) {
      firstIdx = i;
    }
  }

  const renderColumns = columns
    .slice(firstIdx, lastIdx + 1)
    .map((column, idx) => ({
      ...column,
      marginLeft: idx === 0 ? offset : 0,
    }));
  return renderColumns;
}

const isVirtualizationRequired = ({
  contentWidth,
  locked,
  width,
}: ColumnGroupType) => {
  return !locked && width / contentWidth < VIRTUALIZATION_THRESHOLD;
};
