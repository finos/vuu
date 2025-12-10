import { describe, expect, it, vi } from "vitest";
import {
  ColumnChangeSource,
  ColumnModel,
  SelectedColumnChangeType,
} from "../../src/column-picker/ColumnModel";
import { getSchema } from "@vuu-ui/vuu-data-test";

const { columns } = getSchema("parentOrders");

function shuffle<T>(arr: T[]) {
  const shuffledArray = arr.slice();
  let currentIndex = shuffledArray.length;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {
    // Pick a remaining element...
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    // And swap it with the current element.
    [shuffledArray[currentIndex], shuffledArray[randomIndex]] = [
      shuffledArray[randomIndex],
      shuffledArray[currentIndex],
    ];
  }
  return shuffledArray;
}
describe("ColumnModel", () => {
  it("derives available columns from allColumns and selectedColumns", () => {
    const columnModel = new ColumnModel(columns, [
      { name: "account", serverDataType: "string" },
      { name: "algo", serverDataType: "string" },
      { name: "exchange", serverDataType: "string" },
      { name: "ric", serverDataType: "string" },
    ]);

    expect(columnModel.selectedColumns).toEqual([
      { name: "account", serverDataType: "string" },
      { name: "algo", serverDataType: "string" },
      { name: "exchange", serverDataType: "string" },
      { name: "ric", serverDataType: "string" },
    ]);

    expect(columnModel.availableColumns).toEqual([
      { name: "averagePrice", serverDataType: "double" },
      { name: "ccy", serverDataType: "string" },
      { name: "childCount", serverDataType: "int" },
      { name: "filledQty", serverDataType: "double" },
      { name: "id", serverDataType: "string" },
      { name: "idAsInt", serverDataType: "int" },
      { name: "openQty", serverDataType: "double" },
      { name: "price", serverDataType: "double" },
      { name: "quantity", serverDataType: "double" },
      { name: "side", serverDataType: "string" },
      { name: "status", serverDataType: "string" },
      { name: "volLimit", serverDataType: "int" },
      { name: "vuuCreatedTimestamp", serverDataType: "epochtimestamp" },
      { name: "vuuUpdatedTimestamp", serverDataType: "epochtimestamp" },
    ]);
  });

  it("sorts available columns by column name", () => {
    const columnModel = new ColumnModel(shuffle(columns), [
      { name: "account", serverDataType: "string" },
      { name: "algo", serverDataType: "string" },
      { name: "exchange", serverDataType: "string" },
      { name: "ric", serverDataType: "string" },
    ]);

    expect(columnModel.selectedColumns).toEqual([
      { name: "account", serverDataType: "string" },
      { name: "algo", serverDataType: "string" },
      { name: "exchange", serverDataType: "string" },
      { name: "ric", serverDataType: "string" },
    ]);

    expect(columnModel.availableColumns).toEqual([
      { name: "averagePrice", serverDataType: "double" },
      { name: "ccy", serverDataType: "string" },
      { name: "childCount", serverDataType: "int" },
      { name: "filledQty", serverDataType: "double" },
      { name: "id", serverDataType: "string" },
      { name: "idAsInt", serverDataType: "int" },
      { name: "openQty", serverDataType: "double" },
      { name: "price", serverDataType: "double" },
      { name: "quantity", serverDataType: "double" },
      { name: "side", serverDataType: "string" },
      { name: "status", serverDataType: "string" },
      { name: "volLimit", serverDataType: "int" },
      { name: "vuuCreatedTimestamp", serverDataType: "epochtimestamp" },
      { name: "vuuUpdatedTimestamp", serverDataType: "epochtimestamp" },
    ]);
  });

  it("adds a column to selectedColumns", () => {
    const columnsChangeHandler = vi.fn();
    const columnModel = new ColumnModel(columns, [
      { name: "account", serverDataType: "string" },
      { name: "algo", serverDataType: "string" },
      { name: "exchange", serverDataType: "string" },
      { name: "ric", serverDataType: "string" },
    ]);

    columnModel.on("change", columnsChangeHandler);
    columnModel.addItemToSelectedColumns(
      "ccy",
      ColumnChangeSource.ColumnPicker,
    );

    expect(columnModel.selectedColumns).toEqual([
      { name: "account", serverDataType: "string" },
      { name: "algo", serverDataType: "string" },
      { name: "exchange", serverDataType: "string" },
      { name: "ric", serverDataType: "string" },
      { name: "ccy", serverDataType: "string" },
    ]);

    expect(columnModel.availableColumns).toEqual([
      { name: "averagePrice", serverDataType: "double" },
      { name: "childCount", serverDataType: "int" },
      { name: "filledQty", serverDataType: "double" },
      { name: "id", serverDataType: "string" },
      { name: "idAsInt", serverDataType: "int" },
      { name: "openQty", serverDataType: "double" },
      { name: "price", serverDataType: "double" },
      { name: "quantity", serverDataType: "double" },
      { name: "side", serverDataType: "string" },
      { name: "status", serverDataType: "string" },
      { name: "volLimit", serverDataType: "int" },
      { name: "vuuCreatedTimestamp", serverDataType: "epochtimestamp" },
      { name: "vuuUpdatedTimestamp", serverDataType: "epochtimestamp" },
    ]);

    expect(columnsChangeHandler).toHaveBeenCalledOnce();
    expect(columnsChangeHandler).toHaveBeenCalledWith(
      [
        { name: "account", serverDataType: "string" },
        { name: "algo", serverDataType: "string" },
        { name: "exchange", serverDataType: "string" },
        { name: "ric", serverDataType: "string" },
        { name: "ccy", serverDataType: "string" },
      ],
      ColumnChangeSource.ColumnPicker,
      {
        type: SelectedColumnChangeType.ColumnAdded,
        column: { name: "ccy", serverDataType: "string" },
      },
    );
  });
  it("removes a column from selectedColumns", () => {
    const columnsChangeHandler = vi.fn();
    const columnModel = new ColumnModel(columns, [
      { name: "account", serverDataType: "string" },
      { name: "algo", serverDataType: "string" },
      { name: "exchange", serverDataType: "string" },
      { name: "ric", serverDataType: "string" },
    ]);

    columnModel.on("change", columnsChangeHandler);
    columnModel.removeItemFromSelectedColumns(
      "algo",
      ColumnChangeSource.ColumnPicker,
    );

    expect(columnModel.selectedColumns).toEqual([
      { name: "account", serverDataType: "string" },
      { name: "exchange", serverDataType: "string" },
      { name: "ric", serverDataType: "string" },
    ]);

    expect(columnModel.availableColumns).toEqual([
      { name: "algo", serverDataType: "string" },
      { name: "averagePrice", serverDataType: "double" },
      { name: "ccy", serverDataType: "string" },
      { name: "childCount", serverDataType: "int" },
      { name: "filledQty", serverDataType: "double" },
      { name: "id", serverDataType: "string" },
      { name: "idAsInt", serverDataType: "int" },
      { name: "openQty", serverDataType: "double" },
      { name: "price", serverDataType: "double" },
      { name: "quantity", serverDataType: "double" },
      { name: "side", serverDataType: "string" },
      { name: "status", serverDataType: "string" },
      { name: "volLimit", serverDataType: "int" },
      { name: "vuuCreatedTimestamp", serverDataType: "epochtimestamp" },
      { name: "vuuUpdatedTimestamp", serverDataType: "epochtimestamp" },
    ]);

    expect(columnsChangeHandler).toHaveBeenCalledOnce();
    expect(columnsChangeHandler).toHaveBeenCalledWith(
      [
        { name: "account", serverDataType: "string" },
        { name: "exchange", serverDataType: "string" },
        { name: "ric", serverDataType: "string" },
      ],
      ColumnChangeSource.ColumnPicker,
      {
        type: SelectedColumnChangeType.ColumnRemoved,
        column: { name: "algo", serverDataType: "string" },
      },
    );
  });

  it("fires an event when selectedColumns are updated", () => {
    const columnsChangeHandler = vi.fn();
    const columnModel = new ColumnModel(columns, [
      { name: "account", serverDataType: "string" },
      { name: "algo", serverDataType: "string" },
      { name: "exchange", serverDataType: "string" },
      { name: "ric", serverDataType: "string" },
    ]);

    columnModel.on("change", columnsChangeHandler);

    columnModel.setSelectedColumns(
      [
        { name: "account", serverDataType: "string" },
        { name: "algo", serverDataType: "string" },
        { name: "ric", serverDataType: "string" },
      ],
      ColumnChangeSource.Table,
    );

    expect(columnModel.selectedColumns).toEqual([
      { name: "account", serverDataType: "string" },
      { name: "algo", serverDataType: "string" },
      { name: "ric", serverDataType: "string" },
    ]);

    expect(columnModel.availableColumns).toEqual([
      { name: "averagePrice", serverDataType: "double" },
      { name: "ccy", serverDataType: "string" },
      { name: "childCount", serverDataType: "int" },
      { name: "exchange", serverDataType: "string" },
      { name: "filledQty", serverDataType: "double" },
      { name: "id", serverDataType: "string" },
      { name: "idAsInt", serverDataType: "int" },
      { name: "openQty", serverDataType: "double" },
      { name: "price", serverDataType: "double" },
      { name: "quantity", serverDataType: "double" },
      { name: "side", serverDataType: "string" },
      { name: "status", serverDataType: "string" },
      { name: "volLimit", serverDataType: "int" },
      { name: "vuuCreatedTimestamp", serverDataType: "epochtimestamp" },
      { name: "vuuUpdatedTimestamp", serverDataType: "epochtimestamp" },
    ]);

    expect(columnsChangeHandler).toHaveBeenCalledOnce();
    expect(columnsChangeHandler).toHaveBeenCalledWith(
      [
        { name: "account", serverDataType: "string" },
        { name: "algo", serverDataType: "string" },
        { name: "ric", serverDataType: "string" },
      ],
      ColumnChangeSource.Table,
      undefined,
    );
  });
  it("filters both selected columns and available columns when search pattern provided", () => {
    const columnModel = new ColumnModel(columns, [
      { name: "account", serverDataType: "string" },
      { name: "algo", serverDataType: "string" },
      { name: "exchange", serverDataType: "string" },
      { name: "ric", serverDataType: "string" },
    ]);

    columnModel.searchPattern = `a`;

    expect(columnModel.selectedColumns).toEqual([
      { name: "account", serverDataType: "string" },
      { name: "algo", serverDataType: "string" },
      { name: "exchange", serverDataType: "string" },
    ]);

    expect(columnModel.availableColumns).toEqual([
      { name: "averagePrice", serverDataType: "double" },
      { name: "idAsInt", serverDataType: "int" },
      { name: "quantity", serverDataType: "double" },
      { name: "status", serverDataType: "string" },
      { name: "vuuCreatedTimestamp", serverDataType: "epochtimestamp" },
      { name: "vuuUpdatedTimestamp", serverDataType: "epochtimestamp" },
    ]);
  });

  //   it("does not fire an event when updated columns have not changed");
  //   it(
  //     "throws an error if non-existent column is added or removed from selected columns",
  //   );
});
