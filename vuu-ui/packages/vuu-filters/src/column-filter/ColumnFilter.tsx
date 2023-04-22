import { TableSchema, useTypeaheadSuggestions } from "@finos/vuu-data";
import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import {
  ComboBoxDeprecated,
  Dropdown,
  Highlighter,
  ListItem,
  ListItemProps,
  ListItemType,
} from "@heswell/salt-lab";
import cx from "classnames";
import {
  ChangeEventHandler,
  HTMLAttributes,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { TypeaheadParams } from "@finos/vuu-protocol-types";
import "./ColumnFilter.css";
import { Button } from "@salt-ds/core";

const classBase = "vuuColumnFilter";

export interface ColumnFilterProps extends HTMLAttributes<HTMLDivElement> {
  schema: TableSchema;
}

const MemoColumnItem = memo(function MemoizedItem({
  item,
  itemTextHighlightPattern,
  ...restProps
}: ListItemProps<ColumnDescriptor>) {
  return (
    <ListItem {...restProps}>
      <span style={{ marginLeft: 10 }}>
        <Highlighter
          matchPattern={itemTextHighlightPattern}
          text={item?.name}
        />
      </span>
    </ListItem>
  );
});

const ColumnListItem: ListItemType<ColumnDescriptor> = (props) => {
  return <MemoColumnItem {...props} />;
};

const columnItemToString = ({ name }: ColumnDescriptor) => name;

export const ColumnFilter = ({
  className,
  schema,
  ...htmlAttributes
}: ColumnFilterProps) => {
  const [selectedColumnName, setSelectedColumnName] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const { table, columns } = schema;
  const [typeaheadValues, setTypeaheadValues] = useState<string[]>([]);
  const getSuggestions = useTypeaheadSuggestions();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelectColumn = useCallback(
    (_evt, column: ColumnDescriptor | null) => {
      if (column) {
        setSelectedColumnName(column.name);
      } else {
        setSelectedColumnName("");
      }
      setTypeaheadValues([]);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    },
    []
  );

  const handleInputChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (evt) => {
      setSearchValue(evt.target.value);
    },
    []
  );

  const handleChange = useCallback((evt, selected) => {
    console.log({ selected });
  }, []);

  const getFilterComponent = useCallback(() => {
    return (
      <ComboBoxDeprecated
        inputRef={inputRef}
        key={selectedColumnName}
        multiSelect
        onInputChange={handleInputChange}
        onChange={handleChange}
        source={typeaheadValues}
        style={{ minWidth: 200 }}
        inputValue={searchValue}
      />
    );
  }, [handleInputChange, searchValue, selectedColumnName, typeaheadValues]);

  const handleClear = useCallback(() => {
    console.log("clear the decks");
  }, []);

  useEffect(() => {
    const defaultTypeaheadParams: TypeaheadParams = [table, selectedColumnName];
    const params: TypeaheadParams = searchValue
      ? [table, selectedColumnName, searchValue]
      : defaultTypeaheadParams;

    getSuggestions(params).then((options) => {
      // if (searchValue) {
      //   options.unshift(`${searchValue}...`);
      // }
      setTypeaheadValues(options);
    });
  }, [searchValue, selectedColumnName, table, getSuggestions]);

  return (
    <div {...htmlAttributes} className={cx(classBase, className)}>
      <Dropdown<ColumnDescriptor>
        ListItem={ColumnListItem}
        fullWidth
        itemToString={columnItemToString}
        onSelectionChange={handleSelectColumn}
        source={columns}
        style={{ width: 200 }}
      />
      {selectedColumnName === "" ? null : <div>{getFilterComponent()}</div>}
      <Button onClick={handleClear}>Clear</Button>
    </div>
  );
};
