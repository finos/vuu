import {
  HTMLAttributes,
  RefCallback,
  useCallback,
  useLayoutEffect,
  useRef,
} from "react";

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

  const displayStats = useCallback(() => {
    const style = getComputedStyle(ref.current as HTMLDivElement);
    const width = style.getPropertyValue("width");
    console.log(`${pad(debugLabel, 8)}width = ${width}`);
  }, [debugLabel]);

  useLayoutEffect(() => displayStats(), [debugLabel, displayStats]);

  return (
    <div
      {...htmlAttributes}
      className="vuuDebugGridItem"
      onClick={displayStats}
      ref={setRef}
    />
  );
};
