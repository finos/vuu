import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { Filter } from "@finos/vuu-filter-types";
import { TypeaheadParams, VuuTable } from "@finos/vuu-protocol-types";
import {
  Dropdown,
  Toolbar,
  ToolbarButton,
  ToolbarField,
} from "@heswell/salt-lab";
import { Text } from "@salt-ds/core";
import { DeleteIcon } from "@salt-ds/icons";
import { HTMLAttributes } from "react";
import { RangeFilter } from "./filter-components/RangeFilter";
import { TypeaheadFilter } from "./filter-components/TypeaheadFilter";
import { ColumnListItem } from "./ColumnListItem";
import { useColumnFilterStore } from "./useColumnFilterStore";

type FilterPanelProps = HTMLAttributes<HTMLDivElement> & {
  table: VuuTable;
  columns: ColumnDescriptor[];
  onFilterSubmit: (filterQuery: string, filter?: Filter) => void;
};

export const ColumnFilter = ({
  className,
  table,
  columns,
  onFilterSubmit,
  ...htmlAttributes
}: FilterPanelProps) => {
  const {
    clear,
    onTypeaheadChange,
    onRangeChange,
    onSelectedColumnChange,
    selectedColumnName,
    rangeValue,
    typeaheadValue,
  } = useColumnFilterStore(onFilterSubmit);

  const getFilterComponent = () => {
    const defaultTypeaheadParams: TypeaheadParams = [table, selectedColumnName];
    const selectedColumnType = columns.find(
      (column) => column.name === selectedColumnName
    )?.serverDataType;

    switch (selectedColumnType) {
      case "string":
      case "char":
        return (
          <ToolbarField
            label="Start typing to select a filter"
            labelPlacement="top"
          >
            <TypeaheadFilter
              defaultTypeaheadParams={defaultTypeaheadParams}
              filterValues={typeaheadValue}
              onChange={onTypeaheadChange}
            />
          </ToolbarField>
        );
      case "int":
      case "long":
      case "double":
        return (
          <ToolbarField label="Select a range" labelPlacement="top">
            <RangeFilter
              defaultTypeaheadParams={defaultTypeaheadParams}
              filterValues={rangeValue}
              onChange={onRangeChange}
            />
          </ToolbarField>
        );
      default:
        return (
          <ToolbarField>
            <Text>Data type unsupported</Text>
          </ToolbarField>
        );
    }
  };

  return (
    <Toolbar
      {...htmlAttributes}
      style={{ alignItems: "center", height: "36px" }}
    >
      <ToolbarField
        label="Select a column to filter"
        labelPlacement="top"
        style={{ width: 180 }}
      >
        <Dropdown<ColumnDescriptor>
          source={columns}
          ListItem={ColumnListItem}
          itemToString={(column) => column.name}
          onSelectionChange={(_evt, column) => onSelectedColumnChange(column)}
        />
      </ToolbarField>
      {selectedColumnName && getFilterComponent()}
      <ToolbarButton onClick={clear}>
        <DeleteIcon />
      </ToolbarButton>
    </Toolbar>
  );
};
