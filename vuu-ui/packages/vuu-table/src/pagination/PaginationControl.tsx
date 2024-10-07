import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { GoToInput, Pagination, Paginator } from "@salt-ds/core";
import cx from "clsx";
import { usePagination } from "./usePagination";

import paginationControlCss from "./PaginationControl.css";
import { HtmlHTMLAttributes, forwardRef } from "react";
import { DataSource } from "@finos/vuu-data-types";

const classBase = "vuuPaginationControl";

export interface PaginationControlProps
  extends HtmlHTMLAttributes<HTMLDivElement> {
  dataSource: DataSource;
}

export const PaginationControl = forwardRef<
  HTMLDivElement,
  PaginationControlProps
>(function PaginationControl(
  { className, dataSource, ...htmlAttributes },
  forwardedRef,
) {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-table",
    css: paginationControlCss,
    window: targetWindow,
  });

  const { onPageChange, pageCount } = usePagination({
    dataSource,
  });

  return (
    <div
      {...htmlAttributes}
      className={cx(classBase, className)}
      ref={forwardedRef}
    >
      <Pagination count={pageCount} onPageChange={onPageChange}>
        <GoToInput />
        <Paginator />
      </Pagination>
    </div>
  );
});
