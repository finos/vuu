import { DataSource } from "@finos/vuu-data";
import { TableConfig } from "@finos/vuu-datagrid-types";
import { registerComponent } from "@finos/vuu-layout";
import {
  TableNext,
  TableProps,
  useControlledTableNavigation,
} from "@finos/vuu-table";
import { Input } from "@salt-ds/core";
import cx from "classnames";
import {
  FormEvent,
  HTMLAttributes,
  RefCallback,
  useCallback,
  useMemo,
  useState,
} from "react";
import "./SearchCell";

import "./InstrumentSearch.css";

const classBase = "vuuInstrumentSearch";

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
  dataSource,
  placeHolder,
  searchColumns = ["description"],
  ...htmlAttributes
}: InstrumentSearchProps) => {
  const baseFilterPattern = useMemo(
    // TODO make this contains once server supports it
    () => searchColumns.map((col) => `${col} starts "__VALUE__"`).join(" or "),
    [searchColumns]
  );

  const { highlightedIndexRef, onHighlight, onKeyDown, tableRef } =
    useControlledTableNavigation(-1, dataSource.size);

  const [searchState, setSearchState] = useState<{
    searchText: string;
    filter: string;
  }>({ searchText: "", filter: "" });

  const handleChange = useCallback(
    (evt: FormEvent<HTMLInputElement>) => {
      const { value } = evt.target as HTMLInputElement;
      const filter = baseFilterPattern.replaceAll("__VALUE__", value);
      setSearchState({
        searchText: value,
        filter,
      });
      dataSource.filter = {
        filter,
      };
    },
    [baseFilterPattern, dataSource]
  );

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
          onChange={handleChange}
        />
      </div>

      <TableNext
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
    </div>
  );
};

registerComponent?.("InstrumentSearch", InstrumentSearch, "view");
