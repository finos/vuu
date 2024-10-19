import { DataSource } from "@finos/vuu-data-types";
import {
  Table,
  TableProps,
  useControlledTableNavigation,
} from "@finos/vuu-table";
import { TableConfig } from "@finos/vuu-table-types";
import { registerComponent } from "@finos/vuu-utils";
import { Input } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { HTMLAttributes, RefCallback, useCallback } from "react";
import { SearchCell } from "./SearchCell";
import { useTableSearch } from "./useTableSearch";

import instrumentSearchCss from "./TableSearch.css";

const classBase = "vuuTableSearch";

const defaultTableConfig: TableConfig = {
  columns: [
    { name: "bbg", hidden: true },
    {
      name: "description",
      width: 200,
      type: {
        name: "string",
        renderer: {
          name: "search-cell",
        },
      },
    },
  ],
  rowSeparators: true,
};

export interface TableSearchProps extends HTMLAttributes<HTMLDivElement> {
  TableProps?: Partial<TableProps>;
  autoFocus?: boolean;
  dataSource: DataSource;
  placeHolder?: string;
  searchColumns: string[];
}

const searchIcon = <span data-icon="search" />;

export const TableSearch = ({
  TableProps,
  autoFocus = false,
  className,
  dataSource: dataSourceProp,
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
          config={defaultTableConfig}
          highlightedIndex={highlightedIndexRef.current}
          renderBufferSize={100}
          {...TableProps}
          className={`${classBase}-list`}
          dataSource={dataSource}
          navigationStyle="row"
          onHighlight={onHighlight}
          ref={tableRef}
          showColumnHeaders={false}
        />
      ) : null}
    </div>
  );
};

registerComponent("search-cell", SearchCell, "cell-renderer", {
  serverDataType: "private",
});

registerComponent?.("TableSearch", TableSearch, "view");
