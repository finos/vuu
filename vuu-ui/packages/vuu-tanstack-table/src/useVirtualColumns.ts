import { useVirtualizer, VirtualItem } from "@tanstack/react-virtual";
import type { Table } from "@tanstack/react-table";
import { RefObject } from "react";
import { DataSourceRow } from "@vuu-ui/vuu-data-types";

export interface VirtualColumnsHookProps {
  scrollableContainerRef: RefObject<HTMLDivElement | null>;
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
  const virtualPaddingLeading = virtualColumns[0]?.start ?? 0;
  const virtualPaddingTrailing =
    columnVirtualizer.getTotalSize() - (virtualColumns.at(-1)?.end ?? 0);

  return {
    virtualItems: virtualColumns,
    virtualPaddingLeading,
    virtualPaddingTrailing,
  };
};
