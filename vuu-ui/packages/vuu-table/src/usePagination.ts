import { SyntheticEvent, useCallback, useMemo, useState } from "react";
import { TableProps } from "./Table";
import { DataSource } from "@finos/vuu-data-types";

export type PaginationHookProps = Pick<
  TableProps,
  "dataSource" | "showPaginationControls"
>;

const getPageCount = (dataSource: DataSource) => {
  const { range, size } = dataSource;
  const pageSize = range.to - range.from;
  if (pageSize > 0) {
    return Math.ceil(size / pageSize);
  } else {
    return 0;
  }
};

export const usePagination = ({
  dataSource,
  showPaginationControls,
}: PaginationHookProps) => {
  const [pageCount, setPageCount] = useState<number>(getPageCount(dataSource));

  useMemo(() => {
    if (showPaginationControls) {
      dataSource.on("page-count", (n: number) => setPageCount(n));
    }
  }, [dataSource, showPaginationControls]);

  const handlePageChange = useCallback(
    (_evt: SyntheticEvent, page: number) => {
      const { range } = dataSource;
      const pageSize = range.to - range.from;
      const firstRow = pageSize * (page - 1);
      console.log(
        `set range ${JSON.stringify({ from: firstRow, to: firstRow + pageSize })}`,
      );
      dataSource.range = { from: firstRow, to: firstRow + pageSize };
    },
    [dataSource],
  );

  return {
    onPageChange: handlePageChange,
    pageCount,
  };
};
