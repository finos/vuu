import { DataSource } from "@finos/vuu-data";
import { TableConfig } from "@finos/vuu-datagrid-types";
import { registerComponent } from "@finos/vuu-layout";
import { TableNext, TableProps } from "@finos/vuu-table";
import { FormField, FormFieldLabel, Input } from "@salt-ds/core";
import cx from "classnames";
import { FormEvent, HTMLAttributes, useCallback, useState } from "react";
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
  dataSource: DataSource;
  searchColumn?: string;
}

const searchIcon = <span data-icon="search" />;

export const InstrumentSearch = ({
  TableProps,
  className,
  dataSource,
  searchColumn = "description",
  ...htmlAttributes
}: InstrumentSearchProps) => {
  const [searchState, setSearchState] = useState<{
    searchText: string;
    filter: string;
  }>({ searchText: "", filter: "" });

  const handleChange = useCallback(
    (evt: FormEvent<HTMLInputElement>) => {
      const { value } = evt.target as HTMLInputElement;
      const filter = `name starts "${value}"`;
      setSearchState({
        searchText: value,
        filter,
      });
      dataSource.filter = {
        filter,
        filterStruct: {
          op: "starts",
          column: searchColumn,
          value,
        },
      };
    },
    [dataSource, searchColumn]
  );

  return (
    <div {...htmlAttributes} className={cx(classBase, className)}>
      <FormField className={`${classBase}-inputField`}>
        <FormFieldLabel></FormFieldLabel>
        <Input
          endAdornment={searchIcon}
          value={searchState.searchText}
          onChange={handleChange}
        />
      </FormField>

      <TableNext
        rowHeight={25}
        config={defaultTableConfig}
        renderBufferSize={100}
        {...TableProps}
        className={`${classBase}-list`}
        dataSource={dataSource}
        showColumnHeaders={false}
      />
    </div>
  );
};

registerComponent?.("InstrumentSearch", InstrumentSearch, "view");
