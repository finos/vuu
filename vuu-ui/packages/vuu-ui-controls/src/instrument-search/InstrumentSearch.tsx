import { DataSource } from "@finos/vuu-data";
import { TableConfig } from "@finos/vuu-datagrid-types";
import { registerComponent } from "@finos/vuu-layout";
import { TableNext } from "@finos/vuu-table";
import { FormField, FormFieldLabel, Input } from "@salt-ds/core";
import cx from "classnames";
import { FormEvent, HTMLAttributes, useCallback, useState } from "react";
import "./SearchCell";

import "./InstrumentSearch.css";

const classBase = "vuuInstrumentSearch";

export interface InstrumentSearchProps extends HTMLAttributes<HTMLDivElement> {
  dataSource: DataSource;
}

const searchIcon = <span data-icon="search" />;

export const InstrumentSearch = ({
  className,
  dataSource,
  ...htmlAttributes
}: InstrumentSearchProps) => {
  const [searchState, setSearchState] = useState<{
    searchText: string;
    filter: string;
  }>({ searchText: "", filter: "" });
  const tableConfig: TableConfig = {
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

  const handleChange = useCallback(
    (evt: FormEvent<HTMLInputElement>) => {
      const { value } = evt.target as HTMLInputElement;
      const filter = `description starts "${value}"`;
      setSearchState({
        searchText: value,
        filter,
      });
      dataSource.filter = {
        filter,
        filterStruct: {
          op: "starts",
          column: "description",
          value,
        },
      };
    },
    [dataSource]
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
        className={`${classBase}-list`}
        config={tableConfig}
        dataSource={dataSource}
        renderBufferSize={100}
        rowHeight={25}
        showColumnHeaders={false}
      />
    </div>
  );
};

registerComponent("InstrumentSearch", InstrumentSearch, "view");
