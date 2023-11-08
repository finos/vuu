import { DataSource } from "@finos/vuu-data";
import { TableConfig } from "@finos/vuu-datagrid-types";
import { registerComponent } from "@finos/vuu-layout";
import { TableNext, TableProps } from "@finos/vuu-table";
import { FormField, FormFieldLabel, Input } from "@salt-ds/core";
import cx from "classnames";
import {
  FormEvent,
  HTMLAttributes,
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
  dataSource: DataSource;
  placeHolder?: string;
  searchColumns?: string[];
}

const searchIcon = <span data-icon="search" />;

export const InstrumentSearch = ({
  TableProps,
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

  return (
    <div {...htmlAttributes} className={cx(classBase, className)}>
      <FormField className={`${classBase}-inputField`}>
        <FormFieldLabel></FormFieldLabel>
        <Input
          endAdornment={searchIcon}
          placeholder={placeHolder}
          value={searchState.searchText}
          onChange={handleChange}
        />
      </FormField>

      <TableNext
        id="instrument-search"
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
