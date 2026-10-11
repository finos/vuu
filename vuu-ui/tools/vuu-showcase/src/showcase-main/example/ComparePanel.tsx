import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { PROPS_PARAM } from "../../example-props";
import { ChromeIcon } from "../chrome/ChromeIcon";
import { useShowcaseContext } from "../ShowcaseProvider";
import { ChromeSelect } from "./ChromeSelect";
import {
  AXIS_LABELS,
  axisValueLabel,
  axisValues,
  COMPARE_AXES,
  COMPARE_CELL_HEIGHT,
  COMPARE_VIEWPORT_HEIGHT,
  type CompareAxis,
  type CompareCell,
  type CompareLayout,
  type CompareRowAxis,
  type CompareSize,
  changeCompareAxis,
  compareCells,
  compareScale,
  compareViewportWidth,
  readCompareLayout,
  writeCompareLayout,
} from "./compare-model";
import {
  type PreviewState,
  standaloneUrl,
  THEME_OPTIONS,
} from "./preview-state";

import "./ComparePanel.css";

const classBase = "ShowcaseCompare";

const themeOptions = THEME_OPTIONS.map(({ label, value }) => ({
  icon: <span className="ShowcasePreviewBar-swatch" data-theme={value} />,
  label,
  value,
}));
const colOptions = COMPARE_AXES.map((value) => ({
  label: AXIS_LABELS[value],
  value,
}));
const rowOptions = [...COMPARE_AXES, "none" as const].map((value) => ({
  label: AXIS_LABELS[value],
  value,
}));

const useCompareLayout = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const layout = readCompareLayout(searchParams);
  const setLayout = useCallback(
    (next: CompareLayout) =>
      setSearchParams((params) => writeCompareLayout(params, next), {
        replace: true,
      }),
    [setSearchParams],
  );
  return [layout, setLayout] as const;
};

const useInView = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (el && !inView) {
      const observer = new IntersectionObserver(
        ([entry]) => entry.isIntersecting && setInView(true),
        { rootMargin: "200px" },
      );
      observer.observe(el);
      return () => observer.disconnect();
    }
  }, [inView]);
  return [ref, inView] as const;
};

const useWidth = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (el) {
      const observer = new ResizeObserver(() => setWidth(el.clientWidth));
      observer.observe(el);
      return () => observer.disconnect();
    }
  }, []);
  return [ref, width] as const;
};

// a cell that never fires load (e.g. a failed request) must not stall the queue
const LOAD_TIMEOUT = 5000;

const sizes: { label: string; title: string; value: CompareSize }[] = [
  {
    label: "Actual size",
    title: "Render each example at the size of its cell",
    value: "actual",
  },
  {
    label: "Fit viewport",
    title: "Render each example at full viewport width, scaled to fit",
    value: "viewport",
  },
];

interface CompareCellViewProps {
  cell: CompareCell;
  index: number;
  label: string;
  /** cells load one at a time, in reading order */
  loadable: boolean;
  onLoaded: (index: number) => void;
  onPromote: (state: Partial<PreviewState>) => void;
  size: CompareSize;
  src: string;
  title: string;
  viewportWidth: number;
}

const CompareCellView = ({
  cell,
  index,
  label,
  loadable,
  onLoaded,
  onPromote,
  size,
  src,
  title,
  viewportWidth,
}: CompareCellViewProps) => {
  const [inViewRef, inView] = useInView<HTMLDivElement>();
  const [frameRef, width] = useWidth<HTMLDivElement>();
  const scale = size === "actual" ? 1 : compareScale(width, viewportWidth);
  const load = loadable && inView;

  const handleLoad = useCallback(() => onLoaded(index), [index, onLoaded]);
  useEffect(() => {
    if (load) {
      const timer = setTimeout(handleLoad, LOAD_TIMEOUT);
      return () => clearTimeout(timer);
    }
  }, [handleLoad, load]);

  return (
    <div className={`${classBase}-cell`} ref={inViewRef}>
      <div
        className={`${classBase}-frame`}
        ref={frameRef}
        style={{
          height:
            size === "actual"
              ? COMPARE_CELL_HEIGHT
              : Math.round(COMPARE_VIEWPORT_HEIGHT * scale),
        }}
      >
        {load && scale > 0 ? (
          <iframe
            className="ShowCaseIFrame"
            onLoad={handleLoad}
            src={src}
            style={
              size === "actual"
                ? { height: "100%", width: "100%" }
                : {
                    height: COMPARE_VIEWPORT_HEIGHT,
                    transform: `scale(${scale})`,
                    width: viewportWidth,
                  }
            }
            title={`${title}, ${label}`}
          />
        ) : (
          <span className={`${classBase}-pending`}>Waiting…</span>
        )}
      </div>
      <button
        aria-label={`Open ${label} in Preview`}
        className={`${classBase}-promote ShowcaseIconButton`}
        onClick={() =>
          onPromote({
            density: cell.state.density,
            mode: cell.state.mode,
            theme: cell.state.theme,
          })
        }
        title="Open in Preview"
        type="button"
      >
        <ChromeIcon name="arrow-right" size={14} />
      </button>
    </div>
  );
};

export interface ComparePanelProps {
  /** opens the Preview tab with the given settings */
  onPromote: (state: Partial<PreviewState>) => void;
  title: string;
}

/**
 * The example rendered once per combination of two preview settings, e.g
 * density × mode. Each cell is an iframe at a fixed virtual viewport, scaled
 * to fit. Cells load progressively, so a matrix of data consuming examples
 * doesn't start all its data sources at once.
 */
export const ComparePanel = ({ onPromote, title }: ComparePanelProps) => {
  const { pathname } = useLocation();
  const { preview, setPreview } = useShowcaseContext();
  const [layout, setLayout] = useCompareLayout();
  // compare the example as configured in the Props panel
  const [searchParams] = useSearchParams();
  const props = searchParams.get(PROPS_PARAM);
  const cells = useMemo(
    () =>
      compareCells(preview, layout).map((cell) => ({
        ...cell,
        src: standaloneUrl(pathname, cell.state, null, false, props),
      })),
    [layout, pathname, preview, props],
  );
  const viewportWidth = compareViewportWidth(preview.vp);
  const isAxis = (axis: CompareAxis) =>
    layout.cols === axis || layout.rows === axis;

  // the number of cells allowed to load, reset when the matrix changes
  const matrixKey = cells.map((cell) => cell.src).join("|");
  const [loadState, setLoadState] = useState({ count: 1, matrixKey });
  const loadCount = loadState.matrixKey === matrixKey ? loadState.count : 1;
  if (loadState.matrixKey !== matrixKey) {
    setLoadState({ count: 1, matrixKey });
  }
  const handleLoaded = useCallback(
    (index: number) =>
      setLoadState((state) =>
        state.matrixKey === matrixKey
          ? { ...state, count: Math.max(state.count, index + 2) }
          : state,
      ),
    [matrixKey],
  );

  const hasRows = layout.rows !== "none";
  const colValues = axisValues(layout.cols);
  const rowValues =
    layout.rows === "none" ? [undefined] : axisValues(layout.rows);
  const cellLabel = (cell: CompareCell) =>
    [
      layout.rows !== "none" && cell.row
        ? axisValueLabel(layout.rows, cell.row)
        : undefined,
      axisValueLabel(layout.cols, cell.col),
    ]
      .filter(Boolean)
      .join(", ");

  return (
    <div className={classBase}>
      <div
        aria-label="Compare settings"
        className="ShowcasePreviewBar"
        role="toolbar"
      >
        {isAxis("theme") ? null : (
          <div className="ShowcasePreviewBar-group">
            <span className="ShowcaseControlLabel">Theme</span>
            <ChromeSelect
              aria-label="Theme"
              onChange={(theme) => setPreview({ theme })}
              options={themeOptions}
              value={preview.theme}
            />
          </div>
        )}
        <div className="ShowcasePreviewBar-group">
          <span className="ShowcaseControlLabel">Columns</span>
          <ChromeSelect<CompareAxis>
            aria-label="Columns"
            onChange={(axis) =>
              setLayout(changeCompareAxis(layout, "cols", axis))
            }
            options={colOptions}
            value={layout.cols}
          />
        </div>
        <div className="ShowcasePreviewBar-group">
          <span className="ShowcaseControlLabel">Rows</span>
          <ChromeSelect<CompareRowAxis>
            aria-label="Rows"
            onChange={(axis) =>
              setLayout(changeCompareAxis(layout, "rows", axis))
            }
            options={rowOptions}
            value={layout.rows}
          />
        </div>
        <div className="ShowcasePreviewBar-end">
          <div className="ShowcaseSegmented" role="group" aria-label="Size">
            {sizes.map(({ label, title, value }) => (
              <button
                aria-pressed={layout.size === value}
                key={value}
                onClick={() => setLayout({ ...layout, size: value })}
                title={title}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className={`${classBase}-canvas`}>
        <div
          className={`${classBase}-grid`}
          style={{
            gridTemplateColumns: `${hasRows ? "auto " : ""}repeat(${colValues.length}, minmax(${layout.size === "actual" ? 320 : 200}px, 1fr))`,
          }}
        >
          {hasRows ? <span /> : null}
          {colValues.map((col) => (
            <div className={`${classBase}-colHeader`} key={col}>
              {axisValueLabel(layout.cols, col)}
            </div>
          ))}
          {rowValues.map((row, rowIndex) => [
            hasRows && row ? (
              <div className={`${classBase}-rowHeader`} key={`row:${row}`}>
                <span>{axisValueLabel(layout.rows as CompareAxis, row)}</span>
              </div>
            ) : null,
            ...colValues.map((_, colIndex) => {
              const index = rowIndex * colValues.length + colIndex;
              const cell = cells[index];
              return (
                <CompareCellView
                  cell={cell}
                  index={index}
                  key={cell.src}
                  label={cellLabel(cell)}
                  loadable={index < loadCount}
                  onLoaded={handleLoaded}
                  onPromote={onPromote}
                  size={layout.size}
                  src={cell.src}
                  title={title}
                  viewportWidth={viewportWidth}
                />
              );
            }),
          ])}
        </div>
      </div>
    </div>
  );
};
