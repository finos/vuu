import { getSchema } from "@vuu-ui/vuu-data-test";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { describe, expect, it, vi } from "vitest";
import {
  ColumnChangeSource,
  ColumnModel,
  SelectedColumnChangeType,
} from "../../src/column-picker/ColumnModel";

const { columns: parentOrderColumns } = getSchema("parentOrders");
const columns = parentOrderColumns.filter((col) => col.name !== "vuuMsg");

describe("ColumnModel", () => {
  it("can remove a column from selectedColumns via removeItemFromSelectedColumns() function", () => {
    const columnsChangeHandler = vi.fn();
    const columnModel = new ColumnModel(columns, [
      { name: "account", serverDataType: "string" },
      { name: "algo", serverDataType: "string" },
      { name: "exchange", serverDataType: "string" },
      { name: "ric", serverDataType: "string" },
    ]);

    columnModel.on("change", columnsChangeHandler);
    columnModel.removeItemFromSelectedColumns("algo", ColumnChangeSource.Table);

    expect(columnModel.selectedColumns).toEqual([
      { name: "account", serverDataType: "string" },
      { name: "exchange", serverDataType: "string" },
      { name: "ric", serverDataType: "string" },
    ]);

    expect(columnsChangeHandler).toHaveBeenCalledOnce();
    expect(columnsChangeHandler).toHaveBeenCalledWith(
      [
        { name: "account", serverDataType: "string" },
        { name: "exchange", serverDataType: "string" },
        { name: "ric", serverDataType: "string" },
      ],
      ColumnChangeSource.Table,
      {
        type: SelectedColumnChangeType.ColumnRemoved,
        column: { name: "algo", serverDataType: "string" },
      },
    );
  });

  it("addRemoveOrReorderSelectedColumns() throws an exception if no change is detected in supplied newSelectedColumns", () => {
    const columnsChangeHandler = vi.fn();
    const initialColumnSelections: ColumnDescriptor[] = [
      { name: "account", serverDataType: "string" },
      { name: "algo", serverDataType: "string" },
      { name: "exchange", serverDataType: "string" },
    ];
    const columnModel = new ColumnModel(columns, initialColumnSelections);

    columnModel.on("change", columnsChangeHandler);
    const newColumnSelections: ColumnDescriptor[] = [
      ...initialColumnSelections,
    ];

    expect(() =>
      columnModel.addRemoveOrReorderSelectedColumns(
        newColumnSelections,
        ColumnChangeSource.ColumnPicker,
      ),
    ).toThrow(/no change detected between current and new selected columns/);

    // selectedColumns did NOT get updated
    expect(columnModel.selectedColumns).toEqual([
      { name: "account", serverDataType: "string" },
      { name: "algo", serverDataType: "string" },
      { name: "exchange", serverDataType: "string" },
    ]);
    expect(columnsChangeHandler).not.toHaveBeenCalled();
  });

  it("addRemoveOrReorderSelectedColumns() throws an exception if there is an attempt to add multiple columns in one invocation", () => {
    const columnsChangeHandler = vi.fn();
    const initialColumnSelections: ColumnDescriptor[] = [
      { name: "account", serverDataType: "string" },
      { name: "algo", serverDataType: "string" },
      { name: "exchange", serverDataType: "string" },
    ];
    const columnModel = new ColumnModel(columns, initialColumnSelections);

    columnModel.on("change", columnsChangeHandler);
    const newColumnSelections: ColumnDescriptor[] = [
      ...initialColumnSelections,
      { name: "ric", serverDataType: "string" },
      { name: "trader", serverDataType: "string" },
    ];
    expect(() =>
      columnModel.addRemoveOrReorderSelectedColumns(
        newColumnSelections,
        ColumnChangeSource.ColumnPicker,
      ),
    ).toThrow(/attempt to add multiple selected columns in a single call/);

    // selectedColumns did NOT get updated
    expect(columnModel.selectedColumns).toEqual([
      { name: "account", serverDataType: "string" },
      { name: "algo", serverDataType: "string" },
      { name: "exchange", serverDataType: "string" },
    ]);
    expect(columnsChangeHandler).not.toHaveBeenCalled();
  });

  it("addRemoveOrReorderSelectedColumns() throws an exception if there is an attempt to remove multiple columns in one invocation", () => {
    const columnsChangeHandler = vi.fn();
    const initialColumnSelections: ColumnDescriptor[] = [
      { name: "account", serverDataType: "string" },
      { name: "algo", serverDataType: "string" },
      { name: "exchange", serverDataType: "string" },
    ];
    const columnModel = new ColumnModel(columns, initialColumnSelections);

    columnModel.on("change", columnsChangeHandler);
    const newColumnSelections: ColumnDescriptor[] = [
      initialColumnSelections[1],
    ];
    expect(() =>
      columnModel.addRemoveOrReorderSelectedColumns(
        newColumnSelections,
        ColumnChangeSource.ColumnPicker,
      ),
    ).toThrow(/attempt to remove multiple selected columns in a single call/);

    // selectedColumns did NOT get updated
    expect(columnModel.selectedColumns).toEqual([
      { name: "account", serverDataType: "string" },
      { name: "algo", serverDataType: "string" },
      { name: "exchange", serverDataType: "string" },
    ]);
    expect(columnsChangeHandler).not.toHaveBeenCalled();
  });

  it("can recognise and process column added to selectedColumns via addRemoveOrReorderSelectedColumns() function", () => {
    const columnsChangeHandler = vi.fn();
    const initialColumnSelections: ColumnDescriptor[] = [
      { name: "account", serverDataType: "string" },
      { name: "algo", serverDataType: "string" },
      { name: "exchange", serverDataType: "string" },
    ];
    const columnModel = new ColumnModel(columns, initialColumnSelections);

    columnModel.on("change", columnsChangeHandler);
    const newColumnSelections: ColumnDescriptor[] = [
      ...initialColumnSelections,
      { name: "ric", serverDataType: "string" },
    ];
    columnModel.addRemoveOrReorderSelectedColumns(
      newColumnSelections,
      ColumnChangeSource.ColumnPicker,
    );

    expect(columnModel.selectedColumns).toEqual([
      { name: "account", serverDataType: "string" },
      { name: "algo", serverDataType: "string" },
      { name: "exchange", serverDataType: "string" },
      { name: "ric", serverDataType: "string" },
    ]);

    expect(columnsChangeHandler).toHaveBeenCalledOnce();
    expect(columnsChangeHandler).toHaveBeenCalledWith(
      [
        { name: "account", serverDataType: "string" },
        { name: "algo", serverDataType: "string" },
        { name: "exchange", serverDataType: "string" },
        { name: "ric", serverDataType: "string" },
      ],
      ColumnChangeSource.ColumnPicker,
      {
        type: SelectedColumnChangeType.ColumnAdded,
        column: { name: "ric", serverDataType: "string" },
      },
    );
  });

  it("can recognise and process column removed from selectedColumns via addRemoveOrReorderSelectedColumns() function", () => {
    const columnsChangeHandler = vi.fn();
    const initialColumnSelections: ColumnDescriptor[] = [
      { name: "account", serverDataType: "string" },
      { name: "algo", serverDataType: "string" },
      { name: "exchange", serverDataType: "string" },
    ];
    const columnModel = new ColumnModel(columns, initialColumnSelections);

    columnModel.on("change", columnsChangeHandler);
    const newColumnSelections: ColumnDescriptor[] =
      initialColumnSelections.filter((column) => column.name != "exchange");
    columnModel.addRemoveOrReorderSelectedColumns(
      newColumnSelections,
      ColumnChangeSource.ColumnPicker,
    );

    expect(columnModel.selectedColumns).toEqual([
      { name: "account", serverDataType: "string" },
      { name: "algo", serverDataType: "string" },
    ]);

    expect(columnsChangeHandler).toHaveBeenCalledOnce();
    expect(columnsChangeHandler).toHaveBeenCalledWith(
      [
        { name: "account", serverDataType: "string" },
        { name: "algo", serverDataType: "string" },
      ],
      ColumnChangeSource.ColumnPicker,
      {
        type: SelectedColumnChangeType.ColumnRemoved,
        column: { name: "exchange", serverDataType: "string" },
      },
    );
  });

  it("can recognise and process reordering to selectedColumns via addRemoveOrReorderSelectedColumns() function", () => {
    const columnsChangeHandler = vi.fn();
    const initialColumnSelections: ColumnDescriptor[] = [
      { name: "account", serverDataType: "string" },
      { name: "algo", serverDataType: "string" },
      { name: "exchange", serverDataType: "string" },
    ];
    const columnModel = new ColumnModel(columns, initialColumnSelections);

    columnModel.on("change", columnsChangeHandler);
    const newColumnSelections: ColumnDescriptor[] = [
      initialColumnSelections[2],
      initialColumnSelections[0],
      initialColumnSelections[1],
    ];
    columnModel.addRemoveOrReorderSelectedColumns(
      newColumnSelections,
      ColumnChangeSource.ColumnPicker,
    );

    expect(columnModel.selectedColumns).toEqual([
      { name: "exchange", serverDataType: "string" },
      { name: "account", serverDataType: "string" },
      { name: "algo", serverDataType: "string" },
    ]);

    expect(columnsChangeHandler).toHaveBeenCalledOnce();
    expect(columnsChangeHandler).toHaveBeenCalledWith(
      [
        { name: "exchange", serverDataType: "string" },
        { name: "account", serverDataType: "string" },
        { name: "algo", serverDataType: "string" },
      ],
      ColumnChangeSource.ColumnPicker,
      {
        type: SelectedColumnChangeType.ColumnsReordered,
      },
    );
  });

  it("updateSelectedColumnsFiltered() throws an exception if supplied newSelectedColumnsFiltered is not a subset of selectedColumns", () => {
    const initialColumnSelections: ColumnDescriptor[] = [
      { name: "account", serverDataType: "string" },
      { name: "algo", serverDataType: "string" },
      { name: "exchange", serverDataType: "string" },
    ];
    const columnModel = new ColumnModel(columns, initialColumnSelections);

    const newSelectedColumnsFiltered: ColumnDescriptor[] = [
      initialColumnSelections[0],
      { name: "trader", serverDataType: "string" },
    ];

    expect(() =>
      columnModel.updateSelectedColumnsFiltered(newSelectedColumnsFiltered),
    ).toThrow(/supplied filtered columns contains unrecognised columns/);

    // selectedColumnsFiltered did NOT get updated
    expect(columnModel.selectedColumnsFiltered).toEqual([
      { name: "account", serverDataType: "string" },
      { name: "algo", serverDataType: "string" },
      { name: "exchange", serverDataType: "string" },
    ]);
  });

  it("updates selectedColumnsFiltered via updateSelectedColumnsFiltered() function", () => {
    const columnModel = new ColumnModel(columns, [
      { name: "account", serverDataType: "string" },
      { name: "algo", serverDataType: "string" },
      { name: "exchange", serverDataType: "string" },
      { name: "ric", serverDataType: "string" },
    ]);

    // Initially the #selectedColumnsFiltered field gets initialised with the supplied selectedColumns
    const initialSelectedColumnsFiltered = columnModel.selectedColumnsFiltered;
    expect(initialSelectedColumnsFiltered.length).toEqual(4);

    // Update to the first two that begin with 'a'
    const newSelectedColumnsFiltered: ColumnDescriptor[] =
      initialSelectedColumnsFiltered.filter((column) =>
        column.name.startsWith("a"),
      );
    columnModel.updateSelectedColumnsFiltered(newSelectedColumnsFiltered);

    const updatedSelectedColumnsFiltered = columnModel.selectedColumnsFiltered;
    expect(updatedSelectedColumnsFiltered.length).toEqual(2);
    expect(updatedSelectedColumnsFiltered[0].name).toEqual("account");
    expect(updatedSelectedColumnsFiltered[1].name).toEqual("algo");

    // selectedColumns did NOT get updated
    expect(columnModel.selectedColumns.length).toEqual(4);
  });
});
