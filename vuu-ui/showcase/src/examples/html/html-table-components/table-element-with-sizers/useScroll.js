import { useCallback, useRef, useState } from "react";

export const useScroll = ({
  bufferCount,
  dataRowCount,
  rowHeight,
  table,
  viewportHeight,
  visibleRowCount,
}) => {
  const spacerStartRef = useRef();
  const spacerEndRef = useRef();
  const scrollTopRef = useRef(0);
  const [firstRowIndex, setFirstRowIndex] = useState(0);

  const renderedRowsCount = visibleRowCount + 2 * bufferCount;
  const renderedRowsHeight = renderedRowsCount * rowHeight;
  const bufferHeight = bufferCount * rowHeight;
  const totalContentHeight = rowHeight * dataRowCount;
  const offscreenContentHeight = totalContentHeight - renderedRowsHeight;
  const maxScrollPos = totalContentHeight - viewportHeight;

  const getSpacerStart = useCallback((scrollPos) => {
    if (scrollPos === 0) {
      return 0;
    } else if (scrollPos < bufferHeight) {
      return 0;
    } else if (scrollPos >= maxScrollPos) {
      return offscreenContentHeight;
    } else if (scrollPos > maxScrollPos - bufferHeight) {
      return offscreenContentHeight;
    } else {
      return scrollPos - bufferHeight;
    }
  }, []);

  const handleScroll = useCallback((e) => {
    const { scrollLeft, scrollTop } = e.target;
    const spacerStart = getSpacerStart(scrollTop);
    const scrolledBy = scrollTop - scrollTopRef.current;
    const isForwards = scrolledBy > 0;

    if (
      isForwards &&
      (Math.abs(scrolledBy) > bufferHeight || scrollTop < bufferHeight)
    ) {
      scrollTopRef.current =
        Math.floor(scrollTop / bufferHeight) * bufferHeight;

      const offsetStart = scrollTop;
      const offsetEnd = offscreenContentHeight - offsetStart;

      spacerStartRef.current.style.height = `${spacerStart}px`;
      spacerEndRef.current.style.height = `${
        offscreenContentHeight - spacerStart
      }px`;

      const firstRowIndex = Math.max(
        0,
        Math.floor(scrollTopRef.current / rowHeight) - bufferCount
      );
      if (firstRowIndex + renderedRowsCount > dataRowCount) {
        setFirstRowIndex(dataRowCount - renderedRowsCount);
      } else {
        setFirstRowIndex(firstRowIndex);
      }
    } else if (
      !isForwards &&
      (Math.abs(scrolledBy) > bufferHeight || scrollTop < bufferHeight)
    ) {
      const oldScrollCurrent = scrollTopRef.current;
      while (scrollTopRef.current - scrollTop > bufferHeight) {
        scrollTopRef.current -= bufferHeight;
      }

      const offsetStart = scrollTop;
      const offsetEnd = offscreenContentHeight - offsetStart;

      spacerStartRef.current.style.height = `${spacerStart}px`;
      spacerEndRef.current.style.height = `${
        offscreenContentHeight - spacerStart
      }px`;
      const firstRowIndex = Math.max(
        0,
        Math.floor(scrollTopRef.current / rowHeight) - bufferCount
      );
      if (firstRowIndex + renderedRowsCount > dataRowCount) {
        setFirstRowIndex(dataRowCount - renderedRowsCount);
      } else {
        setFirstRowIndex(firstRowIndex);
      }
    }

    table.current.scrollLeft = scrollLeft;
    table.current.scrollTop = scrollTop;
  }, []);

  const lastRowIndex = firstRowIndex + renderedRowsCount;

  return {
    firstRowIndex,
    handleScroll,
    lastRowIndex,
    offscreenContentHeight,
    spacerEndRef,
    spacerStartRef,
  };
};
