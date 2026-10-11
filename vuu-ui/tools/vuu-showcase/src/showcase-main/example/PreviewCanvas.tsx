import { useEffect, useRef, useState } from "react";
import { IFrame } from "../iframe";
import type { Density, ViewportPreset } from "./preview-state";

import "./PreviewCanvas.css";

const classBase = "ShowcasePreviewCanvas";

export interface PreviewCanvasProps {
  density: Density;
  src: string;
  title: string;
  viewport: ViewportPreset;
}

const useElementSize = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<[number, number]>();
  useEffect(() => {
    const el = ref.current;
    if (el) {
      const observer = new ResizeObserver(() =>
        setSize([el.clientWidth, el.clientHeight]),
      );
      observer.observe(el);
      return () => observer.disconnect();
    }
  }, []);
  return [ref, size] as const;
};

/**
 * The example renders in a framed 'device' on a dotted canvas. The device
 * fills the canvas, or has the width of the selected viewport preset.
 */
export const PreviewCanvas = ({
  density,
  src,
  title,
  viewport,
}: PreviewCanvasProps) => {
  const [deviceRef, size] = useElementSize();
  return (
    <div className={classBase} data-viewport={viewport}>
      <div
        className={`${classBase}-device`}
        ref={deviceRef}
        style={viewport === "fill" ? undefined : { width: Number(viewport) }}
      >
        <IFrame src={src} title={title} />
      </div>
      {size ? (
        <span className={`${classBase}-size`}>
          {`${size[0].toLocaleString()} × ${size[1].toLocaleString()} · ${density.charAt(0).toUpperCase()}${density.slice(1)}`}
        </span>
      ) : null}
    </div>
  );
};
