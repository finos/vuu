import { HTMLAttributes, RefCallback, useCallback, useRef } from "react";

export interface DebugGridItemProps extends HTMLAttributes<HTMLDivElement> {
  debugLabel?: string;
}

const spaces = "                       ";
const pad = (str: string, length: number) => (str + spaces).slice(0, length);

export const DebugGridItem = ({ debugLabel = "", ...htmlAttributes }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const setRef = useCallback<RefCallback<HTMLDivElement>>((el) => {
    ref.current = el;
  }, []);

  return <div {...htmlAttributes} className="vuuDebugGridItem" ref={setRef} />;
};
