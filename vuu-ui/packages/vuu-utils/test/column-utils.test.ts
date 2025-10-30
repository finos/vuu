//Testing for issue #639
import { describe, expect, it } from "vitest";
import {
  addColumnToSubscribedColumns,
  applyWidthToColumns,
} from "../src/column-utils";
import type { RuntimeColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { getColumnsInViewport } from "../src/column-utils";

describe("applyWidthToColumns", () => {
  describe("static layouts", () => {
    it("defaults to static layout, all width applied by user", () => {
      const columns: Partial<RuntimeColumnDescriptor>[] = [
        { name: "id", label: "ID", width: 100 },
        { name: "id", label: "ID", width: 100 },
        { name: "id", label: "ID", width: 100 },
      ];
      const result = applyWidthToColumns(columns as RuntimeColumnDescriptor[], {
        columnLayout: "static",
      });
      expect(result).toEqual(columns);
    });
    it("defaulting to static but pass default width of 80", () => {
      const columns: Partial<RuntimeColumnDescriptor>[] = [
        { name: "id", label: "ID", width: 80 },
        { name: "id", label: "ID", width: 80 },
        { name: "id", label: "ID", width: 80 },
      ];
      const result = applyWidthToColumns(columns as RuntimeColumnDescriptor[], {
        columnLayout: "static",
        defaultWidth: 80,
      });
      expect(result).toEqual([
        { name: "id", label: "ID", width: 80 },
        { name: "id", label: "ID", width: 80 },
        { name: "id", label: "ID", width: 80 },
      ]);
    });
    it("defaults to static when width exceeds available width", () => {
      const columns: Partial<RuntimeColumnDescriptor>[] = [
        { name: "id", label: "ID", width: 400 },
        { name: "id", label: "ID", width: 300 },
        { name: "id", label: "ID", width: 500 },
      ];
      const result = applyWidthToColumns(columns as RuntimeColumnDescriptor[], {
        columnLayout: "static",
      });
      expect(result).toEqual(columns);
    });
  });
  describe("Fit layouts", () => {
    it("stretches column widths to fit available space when total column width is less than available width", () => {
      const columns: Partial<RuntimeColumnDescriptor>[] = [
        { name: "ID", label: "id", width: 80 },
        { name: "ID", label: "id", width: 80 },
        { name: "ID", label: "id", width: 80 },
      ];
      const result = applyWidthToColumns(columns as RuntimeColumnDescriptor[], {
        columnLayout: "fit",
        availableWidth: 300,
      });
      expect(result).toEqual([
        { name: "ID", label: "id", width: 100 },
        { name: "ID", label: "id", width: 100 },
        { name: "ID", label: "id", width: 100 },
      ]);
    });
    it("squeezes columns widths to fit the available space when the total column width is greater than available width", () => {
      const columns: Partial<RuntimeColumnDescriptor>[] = [
        { name: "ID", label: "id", width: 120 },
        { name: "ID", label: "id", width: 120 },
        { name: "ID", label: "id", width: 120 },
      ];
      const result = applyWidthToColumns(columns as RuntimeColumnDescriptor[], {
        columnLayout: "fit",
        availableWidth: 300,
      });
      expect(result).toEqual([
        { name: "ID", label: "id", width: 100 },
        { name: "ID", label: "id", width: 100 },
        { name: "ID", label: "id", width: 100 },
      ]);
    });
    it("squeezes columns widths of some columns, when the total column width is greater than available width, one column minWidth", () => {
      const columns: Partial<RuntimeColumnDescriptor>[] = [
        { name: "ID", label: "id", width: 120 },
        { name: "ID", label: "id", width: 120, minWidth: 120 },
        { name: "ID", label: "id", width: 120 },
      ];
      const result = applyWidthToColumns(columns as RuntimeColumnDescriptor[], {
        columnLayout: "fit",
        availableWidth: 300,
      });
      expect(result).toEqual([
        { name: "ID", label: "id", width: 90 },
        { name: "ID", label: "id", width: 120, minWidth: 120 },
        { name: "ID", label: "id", width: 90 },
      ]);
    });
    it("applies fit layout when the total column width is greater than available width, two have a minWidth", () => {
      const columns: Partial<RuntimeColumnDescriptor>[] = [
        { name: "ID", label: "id", width: 120 },
        { name: "ID", label: "id", width: 120, minWidth: 105 },
        { name: "ID", label: "id", width: 120, minWidth: 110 },
      ];
      const result = applyWidthToColumns(columns as RuntimeColumnDescriptor[], {
        columnLayout: "fit",
        availableWidth: 300,
      });
      expect(result).toEqual([
        { name: "ID", label: "id", width: 85 },
        { name: "ID", label: "id", width: 105, minWidth: 105 },
        { name: "ID", label: "id", width: 110, minWidth: 110 },
      ]);
    });
    it("does not change columns when columns fit", () => {
      const columns: Partial<RuntimeColumnDescriptor>[] = [
        { name: "ID", label: "id", width: 80, maxWidth: 150 },
        { name: "ID", label: "id", width: 80, maxWidth: 150 },
        { name: "ID", label: "id", width: 80, maxWidth: 150 },
      ];
      const result = applyWidthToColumns(columns as RuntimeColumnDescriptor[], {
        columnLayout: "fit",
        availableWidth: 300,
      });
      expect(result).toEqual([
        { name: "ID", label: "id", width: 100, maxWidth: 150 },
        { name: "ID", label: "id", width: 100, maxWidth: 150 },
        { name: "ID", label: "id", width: 100, maxWidth: 150 },
      ]);
    });
    it("applies fit layout when the total column width is less than the available width, and one column has maxWidth", () => {
      const columns: Partial<RuntimeColumnDescriptor>[] = [
        { name: "ID", label: "id", width: 70 },
        { name: "ID", label: "id", width: 70, maxWidth: 150 },
        { name: "ID", label: "id", width: 70 },
      ];
      const result = applyWidthToColumns(columns as RuntimeColumnDescriptor[], {
        columnLayout: "fit",
        availableWidth: 300,
      });
      expect(result).toEqual([
        { name: "ID", label: "id", width: 100 },
        { name: "ID", label: "id", width: 100, maxWidth: 150 },
        { name: "ID", label: "id", width: 100 },
      ]);
    });
    it("applies fit layout when the total column width is less than the available width, and two column has maxWidth", () => {
      const columns: Partial<RuntimeColumnDescriptor>[] = [
        { name: "ID", label: "id", width: 90, maxWidth: 120 },
        { name: "ID", label: "id", width: 90, maxWidth: 110 },
        { name: "ID", label: "id", width: 90 },
      ];
      const result = applyWidthToColumns(columns as RuntimeColumnDescriptor[], {
        columnLayout: "fit",
        availableWidth: 300,
      });
      expect(result).toEqual([
        { name: "ID", label: "id", width: 100, maxWidth: 120 },
        { name: "ID", label: "id", width: 100, maxWidth: 110 },
        { name: "ID", label: "id", width: 100 },
      ]);
    });
    it("applies defaultMinWidth when minWidth is not provided"),
      () => {
        const columns: Partial<RuntimeColumnDescriptor>[] = [
          { name: "ID", label: "id", width: 100 },
          { name: "ID", label: "id" },
          { name: "ID", label: "id" },
        ];
        const result = applyWidthToColumns(
          columns as RuntimeColumnDescriptor[],
          {
            columnLayout: "fit",
            availableWidth: 300,
            defaultMinWidth: 50,
          },
        );
        expect(result).toEqual([
          { name: "ID", label: "id", width: 50 },
          { name: "ID", label: "id", width: 50 },
          { name: "ID", label: "id", width: 60 },
        ]);
      };
    it("applies defaultMaxWidth when maxWidth is not exceeded"),
      () => {
        const columns: Partial<RuntimeColumnDescriptor>[] = [
          { name: "ID", label: "id", width: 100 },
          { name: "ID", label: "id", width: 150, maxWidth: 250 },
          { name: "ID", label: "id", width: 100 },
        ];
        const result = applyWidthToColumns(
          columns as RuntimeColumnDescriptor[],
          {
            columnLayout: "fit",
            availableWidth: 500,
            defaultMaxWidth: 250,
          },
        );
        expect(result).toEqual([
          { name: "ID", label: "id", width: 100 },
          { name: "ID", label: "id", width: 150, maxWidth: 200 },
          { name: "ID", label: "id", width: 150, maxWidth: 250 },
        ]);
      };
    it("applies defaultMaxWidth when no maxWidth is provided", () => {
      const columns: Partial<RuntimeColumnDescriptor>[] = [
        { name: "ID", label: "id", width: 100 },
        { name: "ID", label: "id", width: 150 },
        { name: "ID", label: "id", width: 100 },
      ];
      const result = applyWidthToColumns(columns as RuntimeColumnDescriptor[], {
        columnLayout: "fit",
        availableWidth: 500,
        defaultMaxWidth: 200,
      });
      expect(result).toEqual([
        { name: "ID", label: "id", width: 150 },
        { name: "ID", label: "id", width: 200 },
        { name: "ID", label: "id", width: 150 },
      ]);
    });

    it("Equally assigns surplus when no minWidth and no maxWidth is provided", () => {
      const columns: Partial<RuntimeColumnDescriptor>[] = [
        { name: "ID", label: "id", width: 100 },
        { name: "ID", label: "id", width: 100 },
        { name: "ID", label: "id", width: 100 },
      ];
      const result = applyWidthToColumns(columns as RuntimeColumnDescriptor[], {
        columnLayout: "fit",
        availableWidth: 500,
      });
      expect(result).toEqual([
        { name: "ID", label: "id", width: 167 },
        { name: "ID", label: "id", width: 167 },
        { name: "ID", label: "id", width: 166 },
      ]);
    });

    it("grows one column to fit available space where we only have two columns and one is non-resizeable", () => {
      const columns: Partial<RuntimeColumnDescriptor>[] = [
        { name: "ID", label: "id", width: 100 },
        { name: "ID", label: "id", width: 50, maxWidth: 50 },
      ];
      const result = applyWidthToColumns(columns as RuntimeColumnDescriptor[], {
        columnLayout: "fit",
        availableWidth: 300,
      });
      expect(result).toEqual([
        { name: "ID", label: "id", width: 250 },
        { name: "ID", label: "id", width: 50, maxWidth: 50 },
      ]);
    });

    it("grows single column to fit available space where we only have one column and a custom maxWidth", () => {
      const columns: Partial<RuntimeColumnDescriptor>[] = [
        { name: "ID", label: "id", width: 100 },
      ];
      const result = applyWidthToColumns(columns as RuntimeColumnDescriptor[], {
        columnLayout: "fit",
        availableWidth: 300,
        defaultMaxWidth: 500,
      });
      expect(result).toEqual([{ name: "ID", label: "id", width: 300 }]);
    });

    describe("WHEN available size exceeds total max widths", () => {
      it("THEN all columns are assigned max width", () => {
        const columns: Partial<RuntimeColumnDescriptor>[] = [
          { name: "ID", label: "id" },
          { name: "ID", label: "id" },
          { name: "ID", label: "id" },
        ];
        const result = applyWidthToColumns(
          columns as RuntimeColumnDescriptor[],
          {
            columnLayout: "fit",
            availableWidth: 1000,
          },
        );
        expect(result).toEqual([
          { name: "ID", label: "id", width: 250 },
          { name: "ID", label: "id", width: 250 },
          { name: "ID", label: "id", width: 250 },
        ]);
      });
    });
  });
  describe("Flex Layout", () => {
    it("applies flex layout with excess width", () => {
      const columns: Partial<RuntimeColumnDescriptor>[] = [
        { name: "ID", label: "id", width: 200, flex: 1 },
        { name: "ID", label: "id", width: 200 },
        { name: "ID", label: "id", width: 200, flex: 1 },
      ];
      const result = applyWidthToColumns(columns as RuntimeColumnDescriptor[], {
        columnLayout: "fit",
        availableWidth: 700,
      });
      expect(result).toEqual([
        { name: "ID", label: "id", width: 250, flex: 1 },
        { name: "ID", label: "id", width: 200 },
        { name: "ID", label: "id", width: 250, flex: 1 },
      ]);
    });
    it("applies flex layout won one of five columns", () => {
      const columns: Partial<RuntimeColumnDescriptor>[] = [
        { name: "ID", label: "id", width: 100 },
        { name: "ID", label: "id", width: 100 },
        { name: "ID", label: "id", width: 200, flex: 1 },
        { name: "ID", label: "id", width: 100 },
        { name: "ID", label: "id", width: 100 },
      ];
      const result = applyWidthToColumns(columns as RuntimeColumnDescriptor[], {
        columnLayout: "fit",
        availableWidth: 500,
      });
      expect(result).toEqual([
        { name: "ID", label: "id", width: 100 },
        { name: "ID", label: "id", width: 100 },
        { name: "ID", label: "id", width: 100, flex: 1 },
        { name: "ID", label: "id", width: 100 },
        { name: "ID", label: "id", width: 100 },
      ]);
    });

    describe("getColumnsInViewport", () => {
      const allColumns = [
        { name: "1", width: 100 },
        { name: "2", width: 100 },
        { name: "3", width: 100 },
        { name: "4", width: 100 },
        { name: "5", width: 100 },
        { name: "6", width: 100 },
        { name: "7", width: 100 },
        { name: "8", width: 100 },
        { name: "9", width: 100 },
      ] as RuntimeColumnDescriptor[];
      //   describe("WHEN at leftmost scroll position", () => {
      describe("WHEN all columns fit within viewport, with space to spare", () => {
        it("THEN all columns are returned", () => {
          const columns = allColumns.slice(0, 3);
          expect(getColumnsInViewport(columns, 0, 500)).toEqual([columns, 0]);
        });
      });
      describe("WHEN all columns fit exactly within viewport", () => {
        it("THEN all columns are returned", () => {
          const columns = allColumns.slice(0, 5);
          expect(getColumnsInViewport(columns, 0, 500)).toEqual([columns, 0]);
        });
      });
      describe("WHEN all columns do not quite fit within viewport (within 200px tolerance)", () => {
        it("THEN all columns are returned", () => {
          const columns = allColumns.slice(0, 6);
          expect(getColumnsInViewport(columns, 0, 500)).toEqual([columns, 0]);
        });
      });
      describe("WHEN columns extends well beyond the viewport", () => {
        it("THEN not all columns are returned", () => {
          const columns = allColumns;
          expect(getColumnsInViewport(columns, 0, 500)).toEqual([
            columns.slice(0, 6),
            0,
          ]);
        });
        describe("AND some columns are pinned right", () => {
          const columns = [
            { name: "1", width: 100 },
            { name: "2", width: 100 },
            { name: "3", width: 100 },
            { name: "4", width: 100 },
            { name: "5", width: 100 },
            { name: "6", width: 100 },
            { name: "7", width: 100 },
            { name: "8", width: 100 },
            { name: "9", width: 100, pin: "right" },
          ] as RuntimeColumnDescriptor[];
          it("THEN pinned columns are always included", () => {
            expect(getColumnsInViewport(columns, 0, 500)).toEqual([
              columns.slice(0, 6).concat([
                {
                  name: "9",
                  width: 100,
                  pin: "right",
                } as RuntimeColumnDescriptor,
              ]),
              0,
            ]);
          });
        });
      });
      describe("WHEN somewhere in middle of scrollable content", () => {
        it("THEN only columns within visibleviewport are returned", () => {
          const columns = allColumns;
          expect(getColumnsInViewport(columns, 300, 600)).toEqual([
            columns.slice(2, 7),
            200,
          ]);
        });
      });
      describe("WHEN at end of scrollable content", () => {
        it("THEN only columns within visibleviewport are returned", () => {
          const columns = allColumns;
          expect(getColumnsInViewport(columns, 500, 900)).toEqual([
            columns.slice(4),
            400,
          ]);
        });
        describe("AND some columns are pinned left", () => {
          const columns = [
            { name: "1", width: 100, pin: "left" },
            { name: "2", width: 100 },
            { name: "3", width: 100 },
            { name: "4", width: 100 },
            { name: "5", width: 100 },
            { name: "6", width: 100 },
            { name: "7", width: 100 },
            { name: "8", width: 100 },
            { name: "9", width: 100 },
          ] as RuntimeColumnDescriptor[];
          it("THEN pinned columns are always included", () => {
            expect(getColumnsInViewport(columns, 500, 900)).toEqual([
              [
                {
                  name: "1",
                  width: 100,
                  pin: "left",
                } as RuntimeColumnDescriptor,
              ].concat(columns.slice(4)),
              300,
            ]);
          });
        });
      });
    });
  });
});

describe("addColumnToSubscribedColumns", () => {
  it("throws when column to be added is not in available", () => {
    expect(() =>
      addColumnToSubscribedColumns([], [], "vuuCreatedTimestamp"),
    ).toThrowError(
      "[column-utils] addColumnToSubscribedColumns column vuuCreatedTimestamp is not available",
    );
    expect(() =>
      addColumnToSubscribedColumns(
        [{ name: "price" }],
        [{ name: "price", serverDataType: "double" }],
        "vuuCreatedTimestamp",
      ),
    ).toThrowError(
      "[column-utils] addColumnToSubscribedColumns column vuuCreatedTimestamp is not available",
    );
  });
  it("throws when column to be added is already subscribed", () => {
    expect(() =>
      addColumnToSubscribedColumns(
        [{ name: "price" }],
        [{ name: "price", serverDataType: "double" }],
        "price",
      ),
    ).toThrowError(
      "[column-utils], addColumnToSubscribedColumns column price is already subscribed",
    );
  });

  it("adds new columns to end of subscribed columns", () => {
    expect(
      addColumnToSubscribedColumns(
        [
          { name: "price", serverDataType: "double" },
          { name: "quantity", serverDataType: "long" },
        ],
        [
          { name: "price", serverDataType: "double" },
          { name: "quantity", serverDataType: "long" },
          { name: "lotSize", serverDataType: "long" },
          { name: "vuuCreatedTimestamp", serverDataType: "long" },
        ],
        "vuuCreatedTimestamp",
      ),
    ).toEqual([
      { name: "price", serverDataType: "double" },
      { name: "quantity", serverDataType: "long" },
      { name: "vuuCreatedTimestamp", serverDataType: "long" },
    ]);
  });
  it("ignores sort order of subscribed columns", () => {
    expect(
      addColumnToSubscribedColumns(
        [
          { name: "quantity", serverDataType: "long" },
          { name: "price", serverDataType: "double" },
        ],
        [
          { name: "price", serverDataType: "double" },
          { name: "quantity", serverDataType: "long" },
          { name: "lotSize", serverDataType: "long" },
          { name: "vuuCreatedTimestamp", serverDataType: "long" },
        ],
        "vuuCreatedTimestamp",
      ),
    ).toEqual([
      { name: "quantity", serverDataType: "long" },
      { name: "price", serverDataType: "double" },
      { name: "vuuCreatedTimestamp", serverDataType: "long" },
    ]);
  });
});
