import { useRef } from "react";

export const useMeasuredContainer = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  return {
    containerRef,
    outerSize: {
      height: 645,
      width: 715,
    },
    innerSize: {
      height: 645,
      width: 715,
    },
  };
};
