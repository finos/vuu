import { SyntheticEvent, useCallback, useMemo, useState } from "react";
import { DataSource } from "@vuu-ui/vuu-data-types";
import { Range } from "@vuu-ui/vuu-utils";

export interface PaginationHookProps {
  dataSource: DataSource;
}

const getPageCount = (dataSource: DataSource) => {
  const { range, size } = dataSource;
  const pageSize = range.to - range.from;
  if (pageSize > 0) {
    return Math.ceil(size / pageSize);
  } else {
    return 0;
  }
};

export const usePagination = ({ dataSource }: PaginationHookProps) => {
  const [pageCount, setPageCount] = useState<number>(getPageCount(dataSource));

  useMemo(() => {
    dataSource.on("page-count", (n: number) => setPageCount(n));
  }, [dataSource]);

  const handlePageChange = useCallback(
    (_evt: SyntheticEvent, page: number) => {
      const { range } = dataSource;
      const pageSize = range.to - range.from;
      const firstRow = pageSize * (page - 1);
      dataSource.range = Range(firstRow, firstRow + pageSize);
    },
    [dataSource],
  );

  return {
    onPageChange: handlePageChange,
    pageCount,
  };
};
