import { useCallback, useMemo, useState } from "react";
import { useTableScroll } from "./useTableScroll";
import { useVirtualViewport } from "./useVirtualViewport";
import { actualRowPositioning } from "@finos/vuu-utils";
import { KeySet } from "@finos/vuu-utils";

export const useTable = () => {
  const [getRowOffset, getRowAtPosition] = actualRowPositioning(30);
  const [range, setRange] = useState({ from: 0, to: 21 });

  const keys = useMemo(() => new KeySet({ from: 0, to: 0 }), []);
  keys.reset(range);

  const { onVerticalScroll } = useVirtualViewport({
    getRowAtPosition,
    setRange,
  });

  const handleVerticalScroll = useCallback(
    (scrollTop: number) => {
      onVerticalScroll(scrollTop);
    },
    [onVerticalScroll]
  );

  const { requestScroll, ...scrollProps } = useTableScroll({
    onVerticalScroll: handleVerticalScroll,
    viewportHeight: 645 - 30,
  });

  return {
    getRowOffset,
    keys,
    range,
    scrollProps,
  };
};
