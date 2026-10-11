import cx from "clsx";
import {
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent,
  useCallback,
  useRef,
  useState,
} from "react";
import type { SplitPaneDirection } from "./useSplitPane";

const classBase = "vuuSplitPane-splitter";

const KEYBOARD_STEP = 1;
const KEYBOARD_STEP_LARGE = 10;

export interface SplitterProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onResize"> {
  direction: SplitPaneDirection;
  onResizeStart: () => boolean;
  onResize: (distance: number) => void;
  onResizeEnd: () => void;
  position?: number;
}

export const Splitter = ({
  className,
  direction,
  onResize,
  onResizeEnd,
  onResizeStart,
  position,
  ...htmlAttributes
}: SplitterProps) => {
  const startPosRef = useRef<number | undefined>(undefined);
  const [active, setActive] = useState(false);
  const isColumn = direction === "column";

  const getPointerPos = useCallback(
    (e: PointerEvent) => (isColumn ? e.clientY : e.clientX),
    [isColumn],
  );

  const handlePointerDown = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (e.button === 0 && onResizeStart()) {
        // prevent text selection, we manage focus ourselves
        e.preventDefault();
        e.currentTarget.focus();
        e.currentTarget.setPointerCapture(e.pointerId);
        startPosRef.current = getPointerPos(e);
        setActive(true);
      }
    },
    [getPointerPos, onResizeStart],
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (startPosRef.current !== undefined) {
        onResize(getPointerPos(e) - startPosRef.current);
      }
    },
    [getPointerPos, onResize],
  );

  const handlePointerEnd = useCallback(() => {
    if (startPosRef.current !== undefined) {
      startPosRef.current = undefined;
      setActive(false);
      onResizeEnd();
    }
  }, [onResizeEnd]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const step = e.shiftKey ? KEYBOARD_STEP_LARGE : KEYBOARD_STEP;
      const [decrementKey, incrementKey] = isColumn
        ? ["ArrowUp", "ArrowDown"]
        : ["ArrowLeft", "ArrowRight"];
      const distance =
        e.key === decrementKey
          ? -step
          : e.key === incrementKey
            ? step
            : e.key === "Home"
              ? -Infinity
              : e.key === "End"
                ? Infinity
                : undefined;

      if (distance !== undefined && onResizeStart()) {
        e.preventDefault();
        onResize(distance);
        onResizeEnd();
      }
    },
    [isColumn, onResize, onResizeEnd, onResizeStart],
  );

  return (
    <div
      aria-label="Resize"
      {...htmlAttributes}
      aria-orientation={isColumn ? "horizontal" : "vertical"}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={position}
      className={cx(classBase, className, {
        [`${classBase}-active`]: active,
      })}
      onKeyDown={handleKeyDown}
      onLostPointerCapture={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      role="separator"
      tabIndex={0}
    />
  );
};
