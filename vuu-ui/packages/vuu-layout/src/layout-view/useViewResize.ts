import { useResizeObserver, WidthHeight } from "@heswell/uitk-core";
import { RefObject, useCallback, useRef } from "react";

const NO_MEASUREMENT: string[] = [];

type size = {
  height?: number;
  width?: number;
};

export interface ViewResizeHookProps {
  mainRef: RefObject<HTMLDivElement>;
  resize?: "defer" | "responsive";
  rootRef: RefObject<HTMLDivElement>;
}

export const useViewResize = ({
  mainRef,
  resize = "responsive",
  rootRef,
}: ViewResizeHookProps) => {
  const deferResize = resize === "defer";

  const mainSize = useRef<size>({});
  const resizeHandle = useRef<number>();

  const setMainSize = useCallback(() => {
    if (mainRef.current) {
      mainRef.current.style.height = mainSize.current.height + "px";
      mainRef.current.style.width = mainSize.current.width + "px";
    }
    resizeHandle.current = undefined;
  }, []);

  const onResize = useCallback(
    ({ height, width }) => {
      mainSize.current.height = height;
      mainSize.current.width = width;
      if (resizeHandle.current !== null) {
        clearTimeout(resizeHandle.current);
      }
      resizeHandle.current = window.setTimeout(setMainSize, 40);
    },
    [setMainSize]
  );

  useResizeObserver(
    rootRef,
    deferResize ? WidthHeight : NO_MEASUREMENT,
    onResize,
    deferResize
  );
};
