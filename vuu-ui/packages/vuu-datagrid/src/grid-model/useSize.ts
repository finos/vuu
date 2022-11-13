import { CSSProperties, useCallback, useState } from "react";

export const sizeOrUndefined = (
  value: null | undefined | string | number
): string | number | undefined =>
  value == null || value === "auto" ? undefined : value;

export type SizeState = {
  height: string | number | undefined;
  measuredHeight: number | null;
  width: string | number | undefined;
  measuredWidth: number | null;
};

export const useSize = (
  style?: CSSProperties,
  height?: number,
  width?: number
): [SizeState, (size: { height: number; width: number }) => void] => {
  const [size, _setSize] = useState<SizeState>({
    height: sizeOrUndefined(style?.height ?? height),
    measuredHeight: null,
    width: sizeOrUndefined(style?.width ?? width),
    measuredWidth: null,
  });

  const setSize = useCallback(
    ({ height, width }: { height: number; width: number }) => {
      _setSize((state) => ({
        ...state,
        measuredHeight: height,
        measuredWidth: width,
      }));
    },
    [_setSize]
  );

  return [size, setSize];
};
