import {
  ColumnPicker,
  ColumnSearch,
  MultiSelectionHandler,
} from "@vuu-ui/vuu-ui-controls";
import { useMemo, useState } from "react";

export const DefaultColumnSearch = () => {
  const columns = useMemo<string[]>(
    () => [
      "bbg",
      "description",
      "currency",
      "exchange",
      "price",
      "quantity",
      "filledQty",
      "lotSize",
      "exchangeRate",
    ],
    [],
  );

  const handleChange = () => {
    console.log("handleChange");
  };
  const handleReorderColumns = () => {
    console.log("handleMoveListItem");
  };

  return (
    <ColumnSearch
      columns={columns}
      data-showcase-center
      style={{ border: "solid 1px black", width: 220, height: 400 }}
      onChange={handleChange}
      onReorderColumns={handleReorderColumns}
    />
  );
};

export const DefaultColumnPicker = () => {
  const [selected, setSelected] = useState<string[]>([]);

  const onSelectionChange: MultiSelectionHandler = (evt, newSelected) => {
    setSelected(newSelected);
  };

  const columns = useMemo<string[]>(
    () => [
      "bbg",
      "description",
      "currency",
      "exchange",
      "price",
      "quantity",
      "filledQty",
      "lotSize",
      "exchangeRate",
    ],
    [],
  );

  return (
    <ColumnPicker
      columns={columns}
      data-showcase-center
      onSelectionChange={onSelectionChange}
      selected={selected}
    />
  );
};
