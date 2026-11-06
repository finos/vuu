import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import {
  type CSSProperties,
  type DragEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useDragContext } from "./drag-drop-next/DragDropProviderNext";
import {
  type DragSource,
  type GridLayoutDockEdge,
  type GridLayoutDockHandler,
  type GridLayoutDragLeaveHandler,
  sourceIsComponent,
  sourceIsTemplate,
} from "./GridLayoutContext";

import gridDockZonesCss from "./GridDockZones.css";

const classBase = "vuuGridDockZone";

const EDGES: readonly GridLayoutDockEdge[] = ["north", "east", "south", "west"];

/** The share of the grid a docked item takes when its size isn't known. */
export const DEFAULT_GRID_DOCK_FRACTION = 0.25;

const isHorizontal = (edge: GridLayoutDockEdge) =>
  edge === "east" || edge === "west";

export interface GridDockZonesProps {
  gridId: string;
  onDockDrop: GridLayoutDockHandler;
  onDockPreview: GridLayoutDockHandler;
  onDragLeave: GridLayoutDragLeaveHandler;
}

/**
 * Drop targets along the outer edges of a grid. They take part in a drag of
 * one of the grid's own items or of a template, from when it enters the grid
 * until it ends, and otherwise let the pointer through. An item keeps its size across the edge; a template takes
 * DEFAULT_GRID_DOCK_FRACTION of the grid.
 */
export const GridDockZones = ({
  gridId,
  onDockDrop,
  onDockPreview,
  onDragLeave,
}: GridDockZonesProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-grid-dock-zones",
    css: gridDockZonesCss,
    window: targetWindow,
  });
  const dragContext = useDragContext();
  const anchorRef = useRef<HTMLDivElement>(null);
  const [target, setTarget] = useState<{
    edge: GridLayoutDockEdge;
    size: number;
  }>();
  const acceptedRef = useRef<{ edge: GridLayoutDockEdge; accepted: boolean }>(
    undefined,
  );

  const canDock = useCallback(
    (dragSource: DragSource | undefined): dragSource is DragSource =>
      sourceIsTemplate(dragSource) ||
      (sourceIsComponent(dragSource) && dragSource.layoutId === gridId),
    [gridId],
  );

  useEffect(() => {
    const grid = anchorRef.current?.parentElement;
    const ownerWindow = grid?.ownerDocument.defaultView;
    if (!grid || !ownerWindow) {
      return;
    }
    // Set on the element, not through state, so the zones take part in the
    // very next dragover.
    const handleDragEnter = () => {
      if (canDock(dragContext.dragSource)) {
        grid.classList.add("vuuGridLayout-docking");
      }
    };
    const handleDragEnd = () => {
      grid.classList.remove("vuuGridLayout-docking");
      acceptedRef.current = undefined;
      setTarget(undefined);
    };
    grid.addEventListener("dragenter", handleDragEnter, true);
    ownerWindow.addEventListener("dragend", handleDragEnd, true);
    // Bubbling, so a zone handles the drop first.
    ownerWindow.addEventListener("drop", handleDragEnd);
    return () => {
      grid.removeEventListener("dragenter", handleDragEnter, true);
      ownerWindow.removeEventListener("dragend", handleDragEnd, true);
      ownerWindow.removeEventListener("drop", handleDragEnd);
    };
  }, [canDock, dragContext]);

  const dockSize = useCallback(
    (edge: GridLayoutDockEdge, dragSource: DragSource) => {
      const grid = anchorRef.current?.parentElement;
      const { height = 0, width = 0 } = grid?.getBoundingClientRect() ?? {};
      if (isHorizontal(edge)) {
        return sourceIsComponent(dragSource)
          ? dragContext.dragElementWidth
          : width * DEFAULT_GRID_DOCK_FRACTION;
      }
      return sourceIsComponent(dragSource)
        ? (dragContext.dragElementHeight ?? height * DEFAULT_GRID_DOCK_FRACTION)
        : height * DEFAULT_GRID_DOCK_FRACTION;
    },
    [dragContext],
  );

  const handleDragOver = useCallback(
    (edge: GridLayoutDockEdge, evt: DragEvent<HTMLDivElement>) => {
      const { dragSource } = dragContext;
      if (!canDock(dragSource)) {
        return;
      }
      const size = dockSize(edge, dragSource);
      if (acceptedRef.current?.edge !== edge) {
        // The pointer may have come from an item, whose drop position
        // would otherwise stay highlighted.
        dragContext.cleanupDragState();
        acceptedRef.current = {
          accepted: onDockPreview(edge, dragSource, size),
          edge,
        };
        setTarget(acceptedRef.current.accepted ? { edge, size } : undefined);
      }
      if (acceptedRef.current.accepted) {
        evt.dataTransfer.dropEffect = "move";
        evt.preventDefault();
      }
    },
    [canDock, dockSize, dragContext, onDockPreview],
  );

  const handleDragLeave = useCallback(
    (edge: GridLayoutDockEdge) => {
      if (acceptedRef.current?.edge === edge) {
        acceptedRef.current = undefined;
        setTarget(undefined);
        onDragLeave();
      }
    },
    [onDragLeave],
  );

  const handleDrop = useCallback(
    (edge: GridLayoutDockEdge, evt: DragEvent<HTMLDivElement>) => {
      const { dragSource } = dragContext;
      if (!canDock(dragSource) || acceptedRef.current?.edge !== edge) {
        return;
      }
      evt.preventDefault();
      if (onDockDrop(edge, dragSource, dockSize(edge, dragSource))) {
        dragContext.completeDrop();
      }
    },
    [canDock, dockSize, dragContext, onDockDrop],
  );

  return (
    <>
      <div aria-hidden className={`${classBase}-anchor`} ref={anchorRef} />
      {EDGES.map((edge) => (
        <div
          className={cx(classBase, `${classBase}-${edge}`, {
            [`${classBase}-targeted`]: target?.edge === edge,
          })}
          data-dock-edge={edge}
          key={edge}
          onDragLeave={() => handleDragLeave(edge)}
          onDragEnter={(evt) => handleDragOver(edge, evt)}
          onDragOver={(evt) => handleDragOver(edge, evt)}
          onDrop={(evt) => handleDrop(edge, evt)}
          style={
            target?.edge === edge
              ? ({
                  "--vuuGridDockZone-size": `${target.size}px`,
                } as CSSProperties)
              : undefined
          }
        >
          <div className={`${classBase}-indicator`} />
        </div>
      ))}
    </>
  );
};
