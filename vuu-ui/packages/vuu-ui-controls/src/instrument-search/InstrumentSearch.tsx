import { DataSource } from "@finos/vuu-data-types";
import { TableConfig } from "@finos/vuu-table-types";
import { registerComponent } from "@finos/vuu-layout";
import {
  Table,
  TableProps,
  useControlledTableNavigation,
} from "@finos/vuu-table";
import { Input } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { HTMLAttributes, RefCallback, useCallback } from "react";
import { SearchCell } from "./SearchCell";
import { useInstrumentSearch } from "./useInstrumentSearch";

import instrumentSearchCss from "./InstrumentSearch.css";

const classBase = "vuuInstrumentSearch";

if (typeof SearchCell !== "function") {
  console.warn("Instrument Search: SearchCell module not loaded ");
}

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

export interface InstrumentSearchProps extends HTMLAttributes<HTMLDivElement> {
  TableProps?: Partial<TableProps>;
  autoFocus?: boolean;
  dataSource: DataSource;
  placeHolder?: string;
  searchColumns?: string[];
}

const searchIcon = <span data-icon="search" />;

export const InstrumentSearch = ({
  TableProps,
  autoFocus = false,
  className,
  dataSource: dataSourceProp,
  placeHolder,
  searchColumns,
  ...htmlAttributes
}: InstrumentSearchProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-instrument-search",
    css: instrumentSearchCss,
    window: targetWindow,
  });

  const { dataSource, onChange, searchState } = useInstrumentSearch({
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

registerComponent?.("InstrumentSearch", InstrumentSearch, "view");
