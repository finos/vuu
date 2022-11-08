import type { ReactElement } from 'react';
import type { rect } from '../common-types';
import { DropTarget } from './DropTarget';
export interface DragDropRect extends rect {
  children?: DragDropRect[];
  header?: {
    top: number;
    left: number;
    right: number;
    bottom: number;
    titleWidth?: number;
  };
  height: number;
  scrolling?: { id: string; scrollTop: number; scrollHeight: number };
  Stack?: { left: number; right: number }[];
  width: number;
}

export interface DropPosition {
  Absolute: boolean;
  Centre: boolean;
  East: boolean;
  EastOrWest: boolean;
  Header: boolean;
  North: boolean;
  NorthOrSouth: boolean;
  offset: number;
  South: boolean;
  SouthOrEast: boolean;
  West: boolean;
}

export type RelativePosition = 'after' | 'before';

export type DropPosTab = {
  index: number;
  left: number;
  positionRelativeToTab: RelativePosition;
  width: number;
};
export interface DropPos {
  closeToTheEdge: number;
  height?: number;
  position: DropPosition;
  tab?: DropPosTab;
  width?: number;
  x: number;
  y: number;
}
