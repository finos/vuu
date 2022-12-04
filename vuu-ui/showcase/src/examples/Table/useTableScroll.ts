import { RefObject, useCallback, useLayoutEffect, useState } from "react";

export type TableMeasurements = {
  left: number;
  right: number;
  top: number;
};

const getPctScroll = (container: HTMLElement) => {
  const { scrollLeft, scrollTop } = container;
  const { clientHeight, clientWidth, scrollHeight, scrollWidth } = container;
  const pctScrollLeft = scrollLeft / (scrollWidth - clientWidth);
  const pctScrollTop = scrollTop / (scrollHeight - clientHeight);
  return [pctScrollLeft, pctScrollTop, scrollLeft, scrollTop];
};

const getMaxScroll = (container: HTMLElement) => {
  const { clientHeight, clientWidth, scrollHeight, scrollWidth } = container;
  return [scrollWidth - clientWidth, scrollHeight - clientHeight];
};

export const useTableScroll = (
  rootRef: RefObject<HTMLDivElement>,
  scrollContainerRef: RefObject<HTMLDivElement>,
  tableContainerRef: RefObject<HTMLDivElement>
) => {
  const [tableMeasurements, setTableMeasurements] = useState<TableMeasurements>(
    {
      left: -1,
      right: -1,
      top: -1,
    }
  );

  const viewportRowCount = 25;

  const scrollTable = useCallback(
    (scrollLeft, scrollTop) => {
      const { current: tableContainer } = tableContainerRef;
      if (tableContainer) {
        tableContainer.scrollLeft = scrollLeft;
        tableContainer.scrollTop = scrollTop;
      }
    },
    [tableContainerRef]
  );

  const handleRootScroll = useCallback(() => {
    const { current: rootContainer } = rootRef;
    const { current: scrollContainer } = scrollContainerRef;
    if (rootContainer && scrollContainer) {
      const [pctScrollLeft, pctScrollTop, scrollLeft, scrollTop] =
        getPctScroll(rootContainer);
      const [maxScrollLeft, maxScrollTop] = getMaxScroll(scrollContainer);
      scrollContainer.scrollLeft = Math.round(pctScrollLeft * maxScrollLeft);
      scrollContainer.scrollTop = Math.round(pctScrollTop * maxScrollTop);
      scrollTable(scrollLeft, scrollTop);
    }
  }, [rootRef, scrollContainerRef, scrollTable]);

  const handleScrollbarScroll = useCallback(() => {
    const { current: rootContainer } = rootRef;
    const { current: scrollContainer } = scrollContainerRef;
    if (rootContainer && scrollContainer) {
      const [pctScrollLeft, pctScrollTop] = getPctScroll(scrollContainer);
      const [maxScrollLeft, maxScrollTop] = getMaxScroll(rootContainer);
      const rootScrollLeft = Math.round(pctScrollLeft * maxScrollLeft);
      const rootScrollTop = Math.round(pctScrollTop * maxScrollTop);
      rootContainer.scrollLeft = rootScrollLeft;
      rootContainer.scrollTop = rootScrollTop;
      scrollTable(rootScrollLeft, rootScrollTop);
    }
  }, [rootRef, scrollContainerRef, scrollTable]);

  useLayoutEffect(() => {
    if (rootRef.current) {
      const { left, right, top } = rootRef.current.getBoundingClientRect();
      console.log(`top ${top}`);
      setTableMeasurements({
        left,
        right,
        top,
      });
    }
  }, [rootRef]);

  return {
    handleScrollbarScroll,
    handleRootScroll,
    tableMeasurements,
    viewportRowCount,
  };
};
