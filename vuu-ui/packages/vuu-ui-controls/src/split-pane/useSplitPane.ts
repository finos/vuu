import { useCallback, useLayoutEffect, useRef, useState } from "react";

export type SplitPaneDirection = "row" | "column";

/**
 * Sizes (in px) of the two panes, measured along the main axis.
 */
export type SplitPaneSizes = [number, number];
export type SplitterMovedHandler = (sizes: SplitPaneSizes) => void;

interface PaneMeasurements {
  size: number;
  minSize: number;
  maxSize: number;
}

interface ResizeState {
  panes: [HTMLElement, HTMLElement];
  measurements: [PaneMeasurements, PaneMeasurements];
  sizes: SplitPaneSizes;
}

export interface SplitPaneHookProps {
  direction: SplitPaneDirection;
  onSplitterMoved?: SplitterMovedHandler;
  paneCount: number;
}

const parsePx = (value: string, defaultValue: number) =>
  value.endsWith("px") ? parseFloat(value) : defaultValue;

const measurePane = (
  el: HTMLElement,
  dimension: "width" | "height",
): PaneMeasurements => {
  const { [dimension]: size } = el.getBoundingClientRect();
  const style = getComputedStyle(el);
  return {
    size,
    minSize: parsePx(style.getPropertyValue(`min-${dimension}`), 0),
    maxSize: parsePx(style.getPropertyValue(`max-${dimension}`), Infinity),
  };
};

const getPanes = (root: HTMLElement | null) => {
  // children are always rendered as [pane, splitter, pane]
  const pane1 = root?.children[0] as HTMLElement | undefined;
  const pane2 = root?.children[2] as HTMLElement | undefined;
  if (pane1 && pane2) {
    return [pane1, pane2] as [HTMLElement, HTMLElement];
  }
};

const toPercentage = ([size1, size2]: SplitPaneSizes) => {
  const total = size1 + size2;
  return total === 0 ? 0 : Math.round((size1 / total) * 100);
};

export const useSplitPane = ({
  direction,
  onSplitterMoved,
  paneCount,
}: SplitPaneHookProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const resizeStateRef = useRef<ResizeState | undefined>(undefined);
  const [splitterPosition, setSplitterPosition] = useState<number | undefined>(
    undefined,
  );
  const dimension = direction === "column" ? "height" : "width";

  const hasSplitter = paneCount === 2;

  useLayoutEffect(() => {
    const panes = hasSplitter ? getPanes(rootRef.current) : undefined;
    if (panes) {
      const [pane1, pane2] = panes;
      setSplitterPosition(
        toPercentage([
          pane1.getBoundingClientRect()[dimension],
          pane2.getBoundingClientRect()[dimension],
        ]),
      );
    }
  }, [dimension, hasSplitter]);

  const beginResize = useCallback(() => {
    const panes = getPanes(rootRef.current);
    if (panes) {
      const [pane1, pane2] = panes;
      const measurements: [PaneMeasurements, PaneMeasurements] = [
        measurePane(pane1, dimension),
        measurePane(pane2, dimension),
      ];
      resizeStateRef.current = {
        panes,
        measurements,
        sizes: [measurements[0].size, measurements[1].size],
      };
      return true;
    }
    return false;
  }, [dimension]);

  /**
   * Resize the panes by moving the splitter `distance` px from the
   * position it occupied when resize began. Sizes are clamped to
   * respect min and max sizes of both panes.
   */
  const resize = useCallback((distance: number) => {
    const resizeState = resizeStateRef.current;
    if (resizeState) {
      const {
        panes: [pane1, pane2],
        measurements: [m1, m2],
      } = resizeState;
      const total = m1.size + m2.size;
      const lowerBound = Math.max(m1.minSize, total - m2.maxSize);
      const upperBound = Math.min(m1.maxSize, total - m2.minSize);
      const size1 = Math.max(
        lowerBound,
        Math.min(upperBound, m1.size + distance),
      );
      const size2 = total - size1;
      pane1.style.flexBasis = `${size1}px`;
      pane2.style.flexBasis = `${size2}px`;
      resizeState.sizes = [size1, size2];
    }
  }, []);

  const endResize = useCallback(() => {
    const resizeState = resizeStateRef.current;
    if (resizeState) {
      resizeStateRef.current = undefined;
      const { measurements, sizes } = resizeState;
      setSplitterPosition(toPercentage(sizes));
      if (
        sizes[0] !== measurements[0].size ||
        sizes[1] !== measurements[1].size
      ) {
        onSplitterMoved?.(sizes);
      }
    }
  }, [onSplitterMoved]);

  return {
    beginResize,
    endResize,
    resize,
    rootRef,
    splitterPosition,
  };
};
