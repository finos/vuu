import {
  type KeyboardEvent,
  type PointerEvent,
  useCallback,
  useRef,
  useState,
} from "react";
import type { NavNodeData } from "../tree-nav/nav-tree";
import { SourceView } from "./SourceView";

const STORAGE_KEY = "vuu-showcase.sourceDock";
export const DOCK_HEIGHT_DEFAULT = 280;
export const DOCK_HEIGHT_MIN = 120;

export interface SourceDockSettings {
  height: number;
  open: boolean;
}

export const clampDockHeight = (height: number, max = Infinity) =>
  Math.round(Math.max(DOCK_HEIGHT_MIN, Math.min(max, height)));

const loadSettings = (): SourceDockSettings => {
  try {
    const { height, open } = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? "{}",
    );
    return {
      height:
        typeof height === "number"
          ? clampDockHeight(height)
          : DOCK_HEIGHT_DEFAULT,
      open: open === true,
    };
  } catch {
    return { height: DOCK_HEIGHT_DEFAULT, open: false };
  }
};

const storeSettings = (settings: SourceDockSettings) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // storage unavailable
  }
};

/** Open state and height of the source dock, persisted as a preference */
export const useSourceDock = () => {
  const [settings, setSettings] = useState(loadSettings);
  const update = useCallback((changes: Partial<SourceDockSettings>) => {
    setSettings((current) => {
      const next = { ...current, ...changes };
      storeSettings(next);
      return next;
    });
  }, []);
  const toggle = useCallback(
    () => update({ open: !settings.open }),
    [settings.open, update],
  );
  return {
    ...settings,
    setHeight: (height: number) => update({ height }),
    toggle,
  };
};

const classBase = "ShowcaseSourceDock";

export interface SourceDockProps {
  height: number;
  nodeData: NavNodeData;
  onResize: (height: number) => void;
}

/** Example source, docked below the preview, resized from its top edge */
export const SourceDock = ({ height, nodeData, onResize }: SourceDockProps) => {
  const dockRef = useRef<HTMLDivElement>(null);
  const [dragHeight, setDragHeight] = useState<number>();

  const maxHeight = () =>
    (dockRef.current?.parentElement?.clientHeight ?? Infinity) * 0.8;

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    const startY = e.clientY;
    const startHeight = height;
    const max = maxHeight();
    const handle = e.currentTarget;
    handle.setPointerCapture(e.pointerId);
    let latest = startHeight;
    const move = (evt: globalThis.PointerEvent) => {
      latest = clampDockHeight(startHeight + startY - evt.clientY, max);
      setDragHeight(latest);
    };
    const up = () => {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", up);
      setDragHeight(undefined);
      onResize(latest);
    };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", up);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const step = e.shiftKey ? 64 : 16;
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      onResize(
        clampDockHeight(
          height + (e.key === "ArrowUp" ? step : -step),
          maxHeight(),
        ),
      );
    }
  };

  return (
    <div
      className={classBase}
      ref={dockRef}
      style={{ height: dragHeight ?? height }}
    >
      <div
        aria-label="Resize source panel"
        aria-orientation="horizontal"
        aria-valuemin={DOCK_HEIGHT_MIN}
        aria-valuenow={dragHeight ?? height}
        className={`${classBase}-resizer`}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        role="separator"
        tabIndex={0}
      />
      <SourceView nodeData={nodeData} />
    </div>
  );
};
