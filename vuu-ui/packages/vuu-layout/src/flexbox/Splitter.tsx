import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import React, {
  HTMLAttributes,
  KeyboardEvent,
  MouseEventHandler,
  useCallback,
  useRef,
  useState,
} from "react";

import splitterCss from "./Splitter.css";

const classBase = "vuuSplitter";

export type SplitterDragStartHandler = (index: number) => void;
export type SplitterDragHandler = (index: number, distance: number) => void;
export type SplitterDragEndHandler = () => void;

export interface SplitterProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onDrag" | "onDragStart"> {
  //TODO change to alignment (vertical | horizontal)
  column: boolean;
  index: number;
  onDragStart: SplitterDragStartHandler;
  onDrag: SplitterDragHandler;
  onDragEnd: SplitterDragEndHandler;
}

export const Splitter = React.memo(function Splitter({
  column,
  index,
  onDrag,
  onDragEnd,
  onDragStart,
  style,
}: SplitterProps) {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-splitter",
    css: splitterCss,
    window: targetWindow,
  });

  const ignoreClick = useRef<boolean>(undefined);
  const rootRef = useRef<HTMLDivElement>(null);
  const lastPos = useRef<number>(0);

  const [active, setActive] = useState(false);

  const handleKeyDownDrag = useCallback(
    ({ key, shiftKey }: KeyboardEvent) => {
      const distance = shiftKey ? 10 : 1;
      if (column && key === "ArrowDown") {
        onDrag(index, distance);
      } else if (column && key === "ArrowUp") {
        onDrag(index, -distance);
      } else if (!column && key === "ArrowLeft") {
        onDrag(index, -distance);
      } else if (!column && key === "ArrowRight") {
        onDrag(index, distance);
      }
    },
    [column, index, onDrag],
  );

  const handleKeyDownInitDrag = useCallback(
    (evt: KeyboardEvent) => {
      const { key } = evt;
      const horizontalMove = key === "ArrowLeft" || key === "ArrowRight";
      const verticalMove = key === "ArrowUp" || key === "ArrowDown";
      if ((column && verticalMove) || (!column && horizontalMove)) {
        onDragStart(index);
        handleKeyDownDrag(evt);
        keyDownHandlerRef.current = handleKeyDownDrag;
      }
    },
    [column, handleKeyDownDrag, index, onDragStart],
  );

  const keyDownHandlerRef = useRef(handleKeyDownInitDrag);
  const handleKeyDown = (evt: KeyboardEvent) => keyDownHandlerRef.current(evt);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      ignoreClick.current = true;
      const pos = e[column ? "clientY" : "clientX"];
      const diff = pos - lastPos.current;
      if (pos && pos !== lastPos.current) {
        onDrag(index, diff);
      }
      lastPos.current = pos;
    },
    [column, index, onDrag],
  );

  const handleMouseUp = useCallback(() => {
    window.removeEventListener("mousemove", handleMouseMove, false);
    window.removeEventListener("mouseup", handleMouseUp, false);
    onDragEnd();
    setActive(false);
    rootRef.current?.focus();
  }, [handleMouseMove, onDragEnd, setActive]);

  const handleMouseDown = useCallback<MouseEventHandler>(
    (e) => {
      lastPos.current = column ? e.clientY : e.clientX;
      onDragStart(index);
      window.addEventListener("mousemove", handleMouseMove, false);
      window.addEventListener("mouseup", handleMouseUp, false);
      e.preventDefault();
      setActive(true);
    },
    [column, handleMouseMove, handleMouseUp, index, onDragStart, setActive],
  );

  const handleClick = () => {
    if (ignoreClick.current) {
      ignoreClick.current = false;
    } else {
      rootRef.current?.focus();
    }
  };

  const handleBlur = () => {
    keyDownHandlerRef.current = handleKeyDownInitDrag;
  };

  const className = cx(classBase, {
    [`${classBase}-active`]: active,
    [`${classBase}-column`]: column,
  });
  return (
    <div
      className={className}
      data-splitter
      ref={rootRef}
      role="separator"
      style={style}
      onBlur={handleBlur}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseDown={handleMouseDown}
      tabIndex={0}
    >
      <div className={`${classBase}-grab-zone`} />
    </div>
  );
});
