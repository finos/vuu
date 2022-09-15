import {
  CSSProperties,
  HTMLAttributes,
  MutableRefObject,
  ReactElement,
  ReactNode,
  RefObject
} from 'react';
import { SplitterProps } from './Splitter';

export interface LayoutContainerProps {
  resizeable?: boolean;
}

export interface FlexboxProps extends LayoutContainerProps, HTMLAttributes<HTMLDivElement> {
  breakPoints?: BreakPointsProp;
  children: ReactElement[];
  cols?: number;
  column?: true;
  fullPage?: number;
  flexFill?: boolean;
  gap?: number;
  onSplitterMoved?: (content: ContentMeta[]) => void;
  row?: true;
  spacing?: number;
  splitterSize?: number;
}

export interface SplitterHookProps {
  children: ReactNode;
  onSplitterMoved?: (content: ContentMeta[]) => void;
  style?: CSSProperties;
}

export interface SplitterHookResult {
  content: ReactElement[];
  rootRef: MutableRefObject<HTMLDivElement | undefined>;
}

export type SplitterFactory = (index: number) => ReactElement<SplitterProps>;

export type ContentMeta = {
  currentSize?: number;
  flexOpen?: boolean;
  flexBasis?: number;
  intrinsicSize?: number;
  minSize?: number;
  placeholder?: boolean;
  resizeable?: boolean;
  shim?: boolean;
  splitter?: boolean;
};

export type FlexSize = {
  size: number;
  minSize: number;
};

export type BreakPoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type BreakPoints = BreakPoint[];
export type BreakPointsProp = {
  [keys in BreakPoint]?: number;
};
