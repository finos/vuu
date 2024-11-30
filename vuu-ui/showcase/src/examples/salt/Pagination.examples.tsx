import {
  GoToInput,
  Pagination,
  PaginationProps,
  Paginator,
} from "@salt-ds/core";
import { SyntheticEvent, useCallback } from "react";

const PaginationTemplate = ({ count = 100 }: Partial<PaginationProps>) => {
  const handlePageChanged = useCallback((_: SyntheticEvent, page: number) => {
    console.log(`page changed ${page}`);
  }, []);
  return (
    <div style={{ display: "flex", width: "fit-content" }}>
      <Pagination count={count} onPageChange={handlePageChanged}>
        <GoToInput />
        <Paginator />
      </Pagination>
    </div>
  );
};

export const DefaultPagination = () => <PaginationTemplate count={25} />;

export const LargeDataset = () => <PaginationTemplate count={10000} />;
