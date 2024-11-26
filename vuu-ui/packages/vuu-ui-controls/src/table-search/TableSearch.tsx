import {
  Table,
  TableProps,
  useControlledTableNavigation,
} from "@finos/vuu-table";
import { registerComponent } from "@finos/vuu-utils";
import { Input } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { HTMLAttributes, RefCallback, useCallback, useMemo } from "react";
import { SearchCell } from "./SearchCell";
import { useTableSearch } from "./useTableSearch";

import instrumentSearchCss from "./TableSearch.css";

const classBase = "vuuTableSearch";

const defaultConfig = {
  rowSeparators: true,
};

export interface TableSearchProps extends HTMLAttributes<HTMLDivElement> {
  TableProps: TableProps;
  autoFocus?: boolean;
  placeHolder?: string;
  searchColumns: string[];
}

const searchIcon = <span data-icon="search" />;

export const TableSearch = ({
  TableProps: { dataSource: dataSourceProp, ...TableProps },
  autoFocus = false,
  className,
  placeHolder,
  searchColumns,
  ...htmlAttributes
}: TableSearchProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-table-search",
    css: instrumentSearchCss,
    window: targetWindow,
  });

  const config = useMemo(
    () => ({
      ...defaultConfig,
      ...TableProps?.config,
    }),

    [TableProps?.config],
  );

  const { dataSource, onChange, searchState } = useTableSearch({
    dataSource: dataSourceProp,
    searchColumns,
  });

  const { highlightedIndexRef, onHighlight, onKeyDown, tableRef } =
    useControlledTableNavigation(-1, dataSource?.size ?? 0);

  const searchCallbackRef = useCallback<RefCallback<HTMLElement>>((el) => {
    setTimeout(() => {
      el?.querySelector("input")?.focus();
    }, 100);
  }, []);

  return (
    <div {...htmlAttributes} className={cx(classBase, className)}>
      <div className={`${classBase}-inputField`}>
        <Input
          inputProps={{ onKeyDown }}
          endAdornment={searchIcon}
          placeholder={placeHolder}
          ref={autoFocus ? searchCallbackRef : null}
          value={searchState.searchText}
          onChange={onChange}
        />
      </div>

      {dataSource ? (
        <Table
          disableFocus
          id="instrument-search"
          rowHeight={25}
          highlightedIndex={highlightedIndexRef.current}
          renderBufferSize={100}
          {...TableProps}
          className={`${classBase}-list`}
          config={config}
          dataSource={dataSource}
          navigationStyle="row"
          onHighlight={onHighlight}
          ref={tableRef}
          searchPattern={searchState.searchText}
          showColumnHeaders={false}
        />
      ) : null}
    </div>
  );
};

registerComponent("search-cell", SearchCell, "cell-renderer", {
  serverDataType: "private",
});
