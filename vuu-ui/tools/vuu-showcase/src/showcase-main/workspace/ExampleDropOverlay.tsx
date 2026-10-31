import cx from "clsx";
import { type DragEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChromeIcon, type ChromeIconName } from "../chrome/ChromeIcon";
import { ToastHint } from "../toast";
import { createWorkspaceFromDrop, type ExampleRef } from "./workspace-actions";
import { useExampleDrag } from "./workspace-drag";
import {
  dropPositionAt,
  type ExampleDropPosition,
  dropRegion,
} from "./workspace-drop";
import { dropPositionLabel } from "./workspace-model";

import "./ExampleDropOverlay.css";

const classBase = "ShowcaseExampleDropOverlay";

const compass: { icon: ChromeIconName; position: ExampleDropPosition }[] = [
  { icon: "arrow-left", position: "north" },
  { icon: "arrow-left", position: "west" },
  { icon: "layout", position: "centre" },
  { icon: "arrow-right", position: "east" },
  { icon: "arrow-right", position: "south" },
];

export interface ExampleDropOverlayProps {
  /** the example currently displayed, the drop target */
  target: ExampleRef;
}

/**
 * Covers the example preview while an example is dragged from the nav tree.
 * Dropping creates a new workspace, with both examples.
 */
export const ExampleDropOverlay = ({ target }: ExampleDropOverlayProps) => {
  const drag = useExampleDrag();
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<ExampleDropPosition>();

  useEffect(() => {
    if (drag === undefined) setPosition(undefined);
  }, [drag]);

  if (drag === undefined || drag.path === target.path) {
    return null;
  }

  const handleDragOver = (evt: DragEvent) => {
    evt.preventDefault();
    evt.dataTransfer.dropEffect = "copy";
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      const compassPosition = (evt.target as HTMLElement).closest<HTMLElement>(
        "[data-position]",
      )?.dataset.position as ExampleDropPosition | undefined;
      setPosition(
        compassPosition ?? dropPositionAt(evt.clientX, evt.clientY, rect),
      );
    }
  };

  const handleDrop = (evt: DragEvent) => {
    evt.preventDefault();
    const rect = ref.current?.getBoundingClientRect();
    const dropPosition =
      position ??
      (rect ? dropPositionAt(evt.clientX, evt.clientY, rect) : "east");
    createWorkspaceFromDrop(target, drag, dropPosition, navigate);
  };

  return (
    <div
      className={classBase}
      onDragLeave={(evt) => {
        if (!ref.current?.contains(evt.relatedTarget as Node)) {
          setPosition(undefined);
        }
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      ref={ref}
    >
      {position ? (
        <div className={`${classBase}-ghost`} style={dropRegion(position)}>
          <span className={`${classBase}-label`}>
            {drag.title} ·{" "}
            {position === "centre" ? "stacked" : dropPositionLabel(position)}
          </span>
        </div>
      ) : null}
      <div aria-hidden className={`${classBase}-compass`}>
        {compass.map(({ icon, position: p }) => (
          <span
            className={cx(`${classBase}-compassButton`, {
              [`${classBase}-compassButton-active`]: p === position,
            })}
            data-position={p}
            key={p}
          >
            <ChromeIcon name={icon} size={14} />
          </span>
        ))}
      </div>
      <ToastHint>
        <ChromeIcon name="layout" size={14} />
        Drop to create a workspace with <b>{target.title}</b> +{" "}
        <b>{drag.title}</b>
        <span className="ShowcaseKbd">Esc</span>
        <span className="ShowcaseToast-muted">to cancel</span>
      </ToastHint>
    </div>
  );
};
