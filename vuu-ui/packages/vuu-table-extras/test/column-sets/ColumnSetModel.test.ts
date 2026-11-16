import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { describe, expect, it, vi } from "vitest";
import {
  ColumnChangeSource,
  ColumnModel,
  SelectedColumnChangeType,
} from "../../src/column-picker/ColumnModel";
import {
  ColumnSetModel,
  type ColumnSetsState,
  getActiveColumnSetColumns,
  getColumnSetNameError,
} from "../../src/column-sets/ColumnSetModel";

const allColumns: ColumnDescriptor[] = [
  "ric",
  "description",
  "bid",
  "ask",
  "last",
  "marketCap",
  "pe",
  "pb",
  "dividendYield",
].map((name) => ({ name }));

const byName = (...names: string[]) =>
  names.map((name) => allColumns.find((col) => col.name === name)!);

const names = (columns: readonly ColumnDescriptor[]) =>
  columns.map(({ name }) => name);

const twoSets: ColumnSetsState = {
  activeColumnSet: "Watchlist",
  columnSets: [
    {
      name: "Watchlist",
      columns: ["ric", "description", "bid", "ask", "last"],
      savedColumns: ["ric", "description", "bid", "ask", "last"],
    },
    {
      name: "Screening",
      columns: ["ric", "marketCap", "pe", "pb", "dividendYield"],
      savedColumns: ["ric", "marketCap", "pe", "pb", "dividendYield"],
    },
  ],
};

const createModels = (
  state?: ColumnSetsState,
  selected = byName("ric", "description", "bid", "ask", "last"),
) => {
  const columnModel = new ColumnModel(allColumns, selected);
  const columnSetModel = new ColumnSetModel(columnModel, state);
  const onChange = vi.fn();
  columnSetModel.on("change", onChange);
  return { columnModel, columnSetModel, onChange };
};

describe("ColumnSetModel", () => {
  it("starts with no column sets", () => {
    const { columnSetModel } = createModels();
    expect(columnSetModel.columnSets).toEqual([]);
    expect(columnSetModel.activeColumnSet).toBeUndefined();
    expect(columnSetModel.isModified).toBe(false);
  });

  it("ignores an active column set that does not exist", () => {
    const { columnSetModel } = createModels({
      ...twoSets,
      activeColumnSet: "Nope",
    });
    expect(columnSetModel.state.activeColumnSet).toBeUndefined();
  });

  describe("saveAs", () => {
    it("saves the columns in view, in order, as the active set", () => {
      const { columnSetModel, onChange } = createModels(
        undefined,
        byName("last", "ric", "bid"),
      );
      columnSetModel.saveAs(" Watchlist ");
      const expected: ColumnSetsState = {
        activeColumnSet: "Watchlist",
        columnSets: [
          {
            name: "Watchlist",
            columns: ["last", "ric", "bid"],
            savedColumns: ["last", "ric", "bid"],
          },
        ],
      };
      expect(columnSetModel.state).toEqual(expected);
      expect(onChange).toHaveBeenCalledWith(expected, "created");
    });

    it("refuses a name already in use, ignoring case", () => {
      const { columnSetModel } = createModels(twoSets);
      expect(() => columnSetModel.saveAs("screening")).toThrow(
        "already exists",
      );
      expect(() => columnSetModel.saveAs("  ")).toThrow("Enter a name");
    });
  });

  describe("setActiveColumnSet", () => {
    it("replaces the selected columns with those of the set", () => {
      const { columnModel, columnSetModel, onChange } = createModels(twoSets);
      const onColumnsChange = vi.fn();
      columnModel.on("change", onColumnsChange);

      columnSetModel.setActiveColumnSet("Screening");

      expect(names(columnModel.selectedColumns)).toEqual([
        "ric",
        "marketCap",
        "pe",
        "pb",
        "dividendYield",
      ]);
      expect(onColumnsChange).toHaveBeenCalledWith(
        columnModel.selectedColumns,
        ColumnChangeSource.ColumnSet,
        { type: SelectedColumnChangeType.ColumnsReplaced },
      );
      expect(columnSetModel.state.activeColumnSet).toBe("Screening");
      expect(onChange).toHaveBeenCalledWith(columnSetModel.state, "activated");
      // showing a set does not edit it
      expect(columnSetModel.columnSets[1].columns).toEqual(
        twoSets.columnSets[1].columns,
      );
    });

    it("ignores column names not available", () => {
      const { columnModel, columnSetModel } = createModels({
        activeColumnSet: "A",
        columnSets: [
          { name: "A", columns: ["ric"], savedColumns: ["ric"] },
          { name: "B", columns: ["ric", "gone"], savedColumns: ["ric"] },
        ],
      });
      columnSetModel.setActiveColumnSet("B");
      expect(names(columnModel.selectedColumns)).toEqual(["ric"]);
    });

    it("throws for an unknown set", () => {
      const { columnSetModel } = createModels(twoSets);
      expect(() => columnSetModel.setActiveColumnSet("Nope")).toThrow();
    });
  });

  describe("editing columns saves to the active set", () => {
    it("saves added, removed and reordered columns", () => {
      const { columnModel, columnSetModel, onChange } = createModels(twoSets);
      const source = ColumnChangeSource.ColumnPicker;

      columnModel.addItemToSelectedColumns("marketCap", source);
      expect(columnSetModel.activeColumnSet?.columns).toEqual([
        "ric",
        "description",
        "bid",
        "ask",
        "last",
        "marketCap",
      ]);
      expect(onChange).toHaveBeenLastCalledWith(columnSetModel.state, "edited");

      columnModel.removeItemFromSelectedColumns("bid", source);
      columnModel.reorderSelectedColumns(
        ["marketCap", "ric", "description", "ask", "last"],
        ColumnChangeSource.Table,
      );
      expect(columnSetModel.activeColumnSet?.columns).toEqual([
        "marketCap",
        "ric",
        "description",
        "ask",
        "last",
      ]);
      // the saved columns are unchanged
      expect(columnSetModel.activeColumnSet?.savedColumns).toEqual(
        twoSets.columnSets[0].savedColumns,
      );
      expect(columnSetModel.isModified).toBe(true);
    });

    it("does not save edits when no set is active", () => {
      const { columnModel, onChange } = createModels();
      columnModel.addItemToSelectedColumns(
        "pe",
        ColumnChangeSource.ColumnPicker,
      );
      expect(onChange).not.toHaveBeenCalled();
    });

    it("stops saving edits once disposed", () => {
      const { columnModel, columnSetModel, onChange } = createModels(twoSets);
      columnSetModel.dispose();
      columnModel.addItemToSelectedColumns(
        "pe",
        ColumnChangeSource.ColumnPicker,
      );
      expect(onChange).not.toHaveBeenCalled();
      columnSetModel.connect();
      columnModel.addItemToSelectedColumns(
        "pb",
        ColumnChangeSource.ColumnPicker,
      );
      expect(onChange).toHaveBeenCalledTimes(1);
    });
  });

  describe("revertToSaved", () => {
    it("restores the columns last saved", () => {
      const { columnModel, columnSetModel, onChange } = createModels(twoSets);
      columnModel.removeItemFromSelectedColumns(
        "description",
        ColumnChangeSource.ColumnPicker,
      );
      columnSetModel.revertToSaved();
      expect(names(columnModel.selectedColumns)).toEqual(
        twoSets.columnSets[0].savedColumns,
      );
      expect(columnSetModel.activeColumnSet?.columns).toEqual(
        twoSets.columnSets[0].savedColumns,
      );
      expect(columnSetModel.isModified).toBe(false);
      expect(onChange).toHaveBeenLastCalledWith(
        columnSetModel.state,
        "reverted",
      );
    });

    it("does nothing when not modified", () => {
      const { columnSetModel, onChange } = createModels(twoSets);
      columnSetModel.revertToSaved();
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe("rename", () => {
    it("renames the active set", () => {
      const { columnSetModel, onChange } = createModels(twoSets);
      columnSetModel.rename("Watchlist", "Prices");
      expect(columnSetModel.state.activeColumnSet).toBe("Prices");
      expect(columnSetModel.columnSets.map(({ name }) => name)).toEqual([
        "Prices",
        "Screening",
      ]);
      expect(onChange).toHaveBeenCalledWith(columnSetModel.state, "renamed");
    });

    it("allows a change of case to the same name, refuses another set's name", () => {
      const { columnSetModel } = createModels(twoSets);
      columnSetModel.rename("Watchlist", "watchlist");
      expect(columnSetModel.state.activeColumnSet).toBe("watchlist");
      expect(() => columnSetModel.rename("watchlist", "Screening")).toThrow(
        "already exists",
      );
    });
  });

  describe("delete", () => {
    it("deletes the active set, leaving the columns in view", () => {
      const { columnModel, columnSetModel, onChange } = createModels(twoSets);
      const selected = columnModel.selectedColumns;
      columnSetModel.delete("Watchlist");
      expect(columnSetModel.state).toEqual({
        columnSets: [twoSets.columnSets[1]],
      });
      expect(columnModel.selectedColumns).toBe(selected);
      expect(onChange).toHaveBeenCalledWith(columnSetModel.state, "deleted");
    });

    it("deletes another set, the active set is unchanged", () => {
      const { columnSetModel } = createModels(twoSets);
      columnSetModel.delete("Screening");
      expect(columnSetModel.state.activeColumnSet).toBe("Watchlist");
      expect(columnSetModel.columnSets).toHaveLength(1);
    });
  });
});

describe("getActiveColumnSetColumns", () => {
  it("returns descriptors for the active set, in order", () => {
    expect(
      names(
        getActiveColumnSetColumns(
          { ...twoSets, activeColumnSet: "Screening" },
          allColumns,
        )!,
      ),
    ).toEqual(["ric", "marketCap", "pe", "pb", "dividendYield"]);
  });
  it("returns undefined when no set is active", () => {
    expect(
      getActiveColumnSetColumns({ columnSets: [] }, allColumns),
    ).toBeUndefined();
  });
});

describe("getColumnSetNameError", () => {
  it("validates names", () => {
    const { columnSets } = twoSets;
    expect(getColumnSetNameError("Value", columnSets)).toBeUndefined();
    expect(getColumnSetNameError("", columnSets)).toBe("Enter a name");
    expect(getColumnSetNameError(" WATCHLIST ", columnSets)).toBe(
      "A column set with this name already exists",
    );
    expect(
      getColumnSetNameError("Watchlist", columnSets, "Watchlist"),
    ).toBeUndefined();
  });
});

describe("ColumnModel.replaceSelectedColumns", () => {
  it("keeps the descriptors of columns already selected", () => {
    const resized = { name: "ric", width: 200 };
    const columnModel = new ColumnModel(allColumns, [resized]);
    columnModel.replaceSelectedColumns(
      ["pe", "ric"],
      ColumnChangeSource.ColumnSet,
    );
    expect(columnModel.selectedColumns).toEqual([{ name: "pe" }, resized]);
  });
  it("does not notify when nothing changes", () => {
    const columnModel = new ColumnModel(allColumns, byName("ric"));
    const onChange = vi.fn();
    columnModel.on("change", onChange);
    columnModel.replaceSelectedColumns(["ric"], ColumnChangeSource.ColumnSet);
    expect(onChange).not.toHaveBeenCalled();
  });
});
