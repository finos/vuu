import { useVirtualizer, VirtualItem } from "@tanstack/react-virtual";
import type { Table } from "@tanstack/react-table";
import { RefObject } from "react";
import { DataSourceRow } from "@finos/vuu-data-types";

export interface VirtualColumnsHookProps {
  scrollableContainerRef: RefObject<HTMLDivElement>;
  table: Table<DataSourceRow>;
}

export type VirtualizedOptions = {
  virtualItems: VirtualItem[];
  virtualPaddingLeading: number;
  virtualPaddingTrailing: number;
};

export const useVirtualColumns = ({
  scrollableContainerRef,
  table,
}: VirtualColumnsHookProps): VirtualizedOptions => {
  const visibleColumns = table.getVisibleLeafColumns();
  const columnVirtualizer = useVirtualizer<
    HTMLDivElement,
    HTMLTableCellElement
  >({
    count: visibleColumns.length,
    getScrollElement: () => scrollableContainerRef.current,
    horizontal: true,
    estimateSize: (index) => visibleColumns[index].getSize(),
    overscan: 3,
  });

  const virtualColumns = columnVirtualizer.getVirtualItems();
  console.log({ virtualColumns });
  const virtualPaddingLeading = virtualColumns[0]?.start ?? 0;
  const virtualPaddingTrailing =
    columnVirtualizer.getTotalSize() - (virtualColumns.at(-1)?.end ?? 0);

  console.log(`virtualPaddingLeading = ${virtualPaddingLeading}`);

  return {
    virtualItems: virtualColumns,
    virtualPaddingLeading,
    virtualPaddingTrailing,
  };
};
