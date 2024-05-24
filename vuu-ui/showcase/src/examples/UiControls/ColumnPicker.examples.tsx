import {
  ColumnPicker,
  ColumnSearch,
  MultiSelectionHandler,
} from "@finos/vuu-ui-controls";
import { useMemo, useState } from "react";

let displaySequence = 10;

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
    []
  );

  const handleChange = () => {
    console.log("handleChange");
  };
  const handleMoveListItem = () => {
    console.log("handleMoveListItem");
  };

  return (
    <ColumnSearch
      columns={columns}
      data-showcase-center
      style={{ border: "solid 1px black", width: 220, height: 400 }}
      onChange={handleChange}
      onMoveListItem={handleMoveListItem}
    />
  );
};
DefaultColumnSearch.displaySequence = displaySequence++;

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
    []
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
DefaultColumnPicker.displaySequence = displaySequence++;
