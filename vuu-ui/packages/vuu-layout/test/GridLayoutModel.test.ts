import { describe, expect, it } from "vitest";
import {
  GridLayoutModel,
  GridLayoutModelItem as Item,
} from "../src/grid-layout/GridLayoutModel";

describe("GridLayoutModel", () => {
  describe("getSplitterPositions", () => {
    describe("WHEN we have a 2 x 1 layout", () => {
      it("THEN we have 1 initial splitter", () => {
        const model = new GridLayoutModel(2, 1);
        model.addGridItem(new Item("green", 1, 2, 1, 2));
        model.addGridItem(new Item("blue", 2, 3, 1, 2));

        const splitters = model.getSplitterPositions();
        // prettier-ignore
        expect(splitters).toEqual([
            {align: "start", id: "blue-splitter-h", orientation: "horizontal", controls: "blue", column: {start: 2, end: 3}, row: {start: 1, end: 2}},
        ])
      });
    });
    describe("WHEN we have a 1 x 2 layout", () => {
      it("THEN we have 1 initial splitter", () => {
        const model = new GridLayoutModel(1, 2);
        model.addGridItem(new Item("green", 1, 2, 1, 2));
        model.addGridItem(new Item("blue", 1, 2, 2, 3));

        const splitters = model.getSplitterPositions();
        // prettier-ignore
        expect(splitters).toEqual([
            {align: "start", id: "blue-splitter-v", orientation: "vertical", controls: "blue", column: {start: 1, end: 2}, row: {start: 2, end: 3}},
        ])
      });
    });
    describe("WHEN we have a 2 x 2 layout", () => {
      it("THEN we have 4 initial splitters", () => {
        const model = new GridLayoutModel(2, 2);
        model.addGridItem(new Item("green", 1, 2, 1, 2));
        model.addGridItem(new Item("blue", 2, 3, 1, 2));
        model.addGridItem(new Item("black", 1, 2, 2, 3));
        model.addGridItem(new Item("red", 2, 3, 2, 3));

        const splitters = model.getSplitterPositions();
        // prettier-ignore
        expect(splitters).toEqual([
            {align: "start", id: "blue-splitter-h", orientation: "horizontal", controls: "blue", column: {start: 2, end: 3}, row: {start: 1, end: 2}},
            {align: "start", id: "black-splitter-v", orientation: "vertical", controls: "black", column: {start: 1, end: 2}, row: {start: 2, end: 3}},
            {align: "start", id: "red-splitter-h", orientation: "horizontal", controls: "red", column: {start: 2, end: 3}, row: {start: 2, end: 3}},
            {align: "start", id: "red-splitter-v", orientation: "vertical", controls: "red", column: {start: 2, end: 3}, row: {start: 2, end: 3}}
        ])
      });
    });

    describe("WHEN we have  2 columns, with 2 rows in the first column", () => {
      it("THEN we have a splitter that spans two rows", () => {
        const model = new GridLayoutModel(2, 2);
        model.addGridItem(new Item("green", 1, 2, 1, 2));
        model.addGridItem(new Item("blue", 2, 3, 1, 3));
        model.addGridItem(new Item("red", 1, 2, 2, 3));

        const splitters = model.getSplitterPositions();
        // prettier-ignore
        expect(splitters).toEqual([
              {align: "start", id: "blue-splitter-h", orientation: "horizontal", controls: "blue", column: {start: 2, end: 3}, row: {start: 1, end: 3}},
              {align: "start", id: "red-splitter-v", orientation: "vertical", controls: "red", column: {start: 1, end: 2}, row: {start: 2, end: 3}}
          ])
      });
    });

    describe("WHEN we have  2 columns, with 2 rows in the second column", () => {
      it("THEN we have a splitter that spans two rows, align end", () => {
        const model = new GridLayoutModel(2, 2);
        model.addGridItem(new Item("green", 1, 2, 1, 3));
        model.addGridItem(new Item("blue", 2, 3, 1, 2));
        model.addGridItem(new Item("red", 2, 3, 2, 3));

        const splitters = model.getSplitterPositions();
        // prettier-ignore
        expect(splitters).toEqual([
            {align: "end", id: "green-splitter-h", orientation: "horizontal", controls: "green", column: {start: 1, end: 2}, row: {start: 1, end: 3}},
            {align: "start", id: "red-splitter-v", orientation: "vertical", controls: "red", column: {start: 2, end: 3}, row: {start: 2, end: 3}}
        ])
      });
    });

    describe("WHEN we have  2 rows, with 2 columns in the first column", () => {
      it("THEN we have a splitter that spans two rows", () => {
        const model = new GridLayoutModel(2, 2);
        model.addGridItem(new Item("green", 1, 2, 1, 2));
        model.addGridItem(new Item("blue", 2, 3, 1, 2));
        model.addGridItem(new Item("red", 1, 3, 2, 3));

        const splitters = model.getSplitterPositions();
        // prettier-ignore
        expect(splitters).toEqual([
              {align: "start", id: "blue-splitter-h", orientation: "horizontal", controls: "blue", column: {start: 2, end: 3}, row: {start: 1, end: 2}},
              {align: "start", id: "red-splitter-v", orientation: "vertical", controls: "red", column: {start: 1, end: 3}, row: {start: 2, end: 3}}
          ])
      });
    });
    describe("WHEN we have  2 rows, with 2 columns in the second column", () => {
      it("THEN we have a splitter that spans two rows, align end", () => {
        const model = new GridLayoutModel(2, 2);
        model.addGridItem(new Item("green", 1, 3, 1, 2));
        model.addGridItem(new Item("blue", 1, 2, 2, 3));
        model.addGridItem(new Item("red", 2, 3, 2, 3));

        const splitters = model.getSplitterPositions();
        // prettier-ignore
        expect(splitters).toEqual([
            {align: "end", id: "green-splitter-v", orientation: "vertical", controls: "green", column: {start: 1, end: 3}, row: {start: 1, end: 2}},
            {align: "start", id: "red-splitter-h", orientation: "horizontal", controls: "red", column: {start: 2, end: 3}, row: {start: 2, end: 3}}
        ])
      });
    });
    describe("WHEN we have a 2 x 2 layout, 2 columns, misaligned rows, aligned top", () => {
      it("THEN we have 3 initial splitters, including a multi-track splitter", () => {
        const model = new GridLayoutModel(2, 3);
        model.addGridItem(new Item("green", 1, 2, 1, 2));
        model.addGridItem(new Item("blue", 2, 3, 1, 3));
        model.addGridItem(new Item("black", 1, 2, 2, 4));
        model.addGridItem(new Item("red", 2, 3, 3, 4));

        const splitters = model.getSplitterPositions();
        expect(splitters.length).toEqual(3);
        // prettier-ignore
        expect(splitters).toEqual([
          {align: "start", id: "blue-splitter-h", orientation: "horizontal", controls: "blue", column: {start: 2, end: 3}, row: {start: 1, end: 4}},
          {align: "start", id: "black-splitter-v", orientation: "vertical", controls: "black", column: {start: 1, end: 2}, row: {start: 2, end: 4}},
          {align: "start", id: "red-splitter-v", orientation: "vertical", controls: "red", column: {start: 2, end: 3}, row: {start: 3, end: 4}}
        ])
      });
    });

    describe("WHEN we have a 2 x 2 layout, 2 columns, misaligned rows, aligned left", () => {
      it("THEN we have 3 initial splitters, including a multi-track splitter", () => {
        const model = new GridLayoutModel(2, 3);
        model.addGridItem(new Item("green", 1, 2, 1, 2));
        model.addGridItem(new Item("blue", 2, 4, 1, 2));
        model.addGridItem(new Item("black", 1, 3, 2, 3));
        model.addGridItem(new Item("red", 3, 4, 2, 3));

        const splitters = model.getSplitterPositions();
        expect(splitters.length).toEqual(3);
        // prettier-ignore
        expect(splitters).toEqual([
          {align: "start", id: "blue-splitter-h", orientation: "horizontal", controls: "blue", column: {start: 2, end: 4}, row: {start: 1, end: 2}},
          {align: "start", id: "black-splitter-v", orientation: "vertical", controls: "black", column: {start: 1, end: 4}, row: {start: 2, end: 3}},
          {align: "start", id: "red-splitter-h", orientation: "horizontal", controls: "red", column: {start: 3, end: 4}, row: {start: 2, end: 3}}
        ])
      });
    });

    describe("WHEN we have a 2 x 2 layout, 2 columns, misaligned rows, aligned bottom", () => {
      it("THEN we have 3 initial splitters, including a multi-track splitter", () => {
        const model = new GridLayoutModel(2, 3);
        model.addGridItem(new Item("green", 1, 2, 1, 3));
        model.addGridItem(new Item("blue", 2, 3, 1, 2));
        model.addGridItem(new Item("black", 1, 2, 3, 4));
        model.addGridItem(new Item("red", 2, 3, 2, 4));

        const splitters = model.getSplitterPositions();

        expect(splitters.length).toEqual(3);
        // prettier-ignore
        expect(splitters).toEqual([
          {align: "start", id: "black-splitter-v", orientation: "vertical", controls: "black", column: {start: 1, end: 2}, row: {start: 3, end: 4}},
          {align: "start", id: "red-splitter-h", orientation: "horizontal", controls: "red", column: {start: 2, end: 3}, row: {start: 1, end: 4}},
          {align: "start", id: "red-splitter-v", orientation: "vertical", controls: "red", column: {start: 2, end: 3}, row: {start: 2, end: 4}},
        ])
      });
    });
  });

  describe("getGridItemsAdjoiningTrack", () => {
    describe("WHEN we have a 2 x 1 layout", () => {
      it("THEN first cell is horizontal contra for second cell", () => {
        const model = new GridLayoutModel(2, 1);
        model.addGridItem(new Item("green", 1, 2, 1, 2));
        model.addGridItem(new Item("blue", 2, 3, 1, 2));

        const { contra, contraOtherTrack } = model.getGridItemsAdjoiningTrack(
          "blue",
          "horizontal",
          "start"
        );
        expect(contra.length).toEqual(1);
        const [gridItem] = contra;
        expect(gridItem.id).toEqual("green");
        expect(contraOtherTrack).toBeUndefined;

        const [contraItem] = contra;
        expect(contraItem.id).toEqual("green");
      });
    });

    describe("WHEN we have a 1 x 2 layout", () => {
      it("THEN first cell is horizontal contra for second cell", () => {
        const model = new GridLayoutModel(1, 2);
        model.addGridItem(new Item("green", 1, 2, 1, 2));
        model.addGridItem(new Item("blue", 1, 2, 2, 3));

        const { contra, contraOtherTrack } = model.getGridItemsAdjoiningTrack(
          "blue",
          "vertical",
          "start"
        );
        expect(contra.length).toEqual(1);
        const [gridItem] = contra;
        expect(gridItem.id).toEqual("green");
        expect(contraOtherTrack).toBeUndefined;
      });
    });
  });

  describe("WHEN we have a 2 x 2 layout", () => {
    const model = new GridLayoutModel(2, 2);
    model.addGridItem(new Item("green", 1, 2, 1, 2));
    model.addGridItem(new Item("blue", 2, 3, 1, 2));
    model.addGridItem(new Item("black", 1, 2, 2, 3));
    model.addGridItem(new Item("red", 2, 3, 2, 3));

    it("THEN first row first cell is horizontal contra for first row second cell", () => {
      const { contra, contraOtherTrack, siblingsOtherTrack, nonAdjacent } =
        model.getGridItemsAdjoiningTrack("blue", "horizontal", "start");

      expect(contra.length).toEqual(1);
      expect(contraOtherTrack?.length).toEqual(1);
      expect(siblingsOtherTrack?.length).toEqual(1);
      expect(nonAdjacent?.length).toEqual(0);

      const [contraItem] = contra;
      expect(contraItem.id).toEqual("green");
    });

    it("THEN second row first cell is horizontal contra for second row second cell", () => {
      const { contra, contraOtherTrack, siblingsOtherTrack, nonAdjacent } =
        model.getGridItemsAdjoiningTrack("red", "horizontal", "start");

      expect(contra.length).toEqual(1);
      expect(contraOtherTrack?.length).toEqual(1);
      expect(siblingsOtherTrack?.length).toEqual(1);
      expect(nonAdjacent?.length).toEqual(0);

      const [contraItem] = contra;
      expect(contraItem.id).toEqual("black");
    });

    it("THEN first row first cell is vertical contra for second row first cell", () => {
      const { contra, contraOtherTrack, siblingsOtherTrack, nonAdjacent } =
        model.getGridItemsAdjoiningTrack("black", "vertical", "start");

      expect(contra.length).toEqual(1);
      expect(contraOtherTrack?.length).toEqual(1);
      expect(siblingsOtherTrack?.length).toEqual(1);
      expect(nonAdjacent?.length).toEqual(0);

      const [contraItem] = contra;
      expect(contraItem.id).toEqual("green");
    });

    it("THEN first row second cell is vertical contra for second row second cell", () => {
      const { contra, contraOtherTrack, siblingsOtherTrack, nonAdjacent } =
        model.getGridItemsAdjoiningTrack("red", "vertical", "start");

      expect(contra.length).toEqual(1);
      expect(contraOtherTrack?.length).toEqual(1);
      expect(siblingsOtherTrack?.length).toEqual(1);
      expect(nonAdjacent?.length).toEqual(0);

      const [contraItem] = contra;
      expect(contraItem.id).toEqual("blue");
    });
  });
  describe("WHEN we have  2 columns, with 2 rows in the second column", () => {
    it("THEN we have a simple resize, with multiple contras", () => {
      const model = new GridLayoutModel(2, 2);
      model.addGridItem(new Item("green", 1, 2, 1, 3));
      model.addGridItem(new Item("blue", 2, 3, 1, 2));
      model.addGridItem(new Item("red", 2, 3, 2, 3));

      const { contra, contraOtherTrack, siblingsOtherTrack, nonAdjacent } =
        model.getGridItemsAdjoiningTrack("green", "horizontal", "end");

      expect(contra.length).toEqual(2);
      expect(contra).toEqual([
        {
          id: "blue",
          column: { start: 2, end: 3 },
          row: { start: 1, end: 2 },
        },
        {
          id: "red",
          column: { start: 2, end: 3 },
          row: { start: 2, end: 3 },
        },
      ]);
      expect(contraOtherTrack.length).toEqual(0);
      expect(siblingsOtherTrack.length).toEqual(0);
      expect(nonAdjacent.length).toEqual(0);
    });
  });

  describe("repositionComponentsforResize", () => {
    describe("WHEN we have a 2 x 2 layout", () => {
      describe("WHEN we expand blue horizontally", () => {
        it("THEN we update blue, black and red", () => {
          const model = new GridLayoutModel(2, 2);
          model.addGridItem(new Item("green", 1, 2, 1, 2));
          const blueItem = new Item("blue", 2, 3, 1, 2);
          model.addGridItem(blueItem);
          model.addGridItem(new Item("black", 1, 2, 2, 3));
          model.addGridItem(new Item("red", 2, 3, 2, 3));

          const direction = "horizontal";
          const adjacentItems = model.getGridItemsAdjoiningTrack(
            "blue",
            direction,
            "start"
          );
          const updates = model.repositionComponentsforResize(
            blueItem,
            adjacentItems,
            direction,
            "expand"
          );

          expect(model.getGridItem("green")).toEqual({
            id: "green",
            column: { start: 1, end: 2 },
            row: { start: 1, end: 2 },
          });
          expect(model.getGridItem("blue")).toEqual({
            id: "blue",
            column: { start: 2, end: 4 },
            row: { start: 1, end: 2 },
          });
          expect(model.getGridItem("black")).toEqual({
            id: "black",
            column: { start: 1, end: 3 },
            row: { start: 2, end: 3 },
          });
          expect(model.getGridItem("red")).toEqual({
            id: "red",
            column: { start: 3, end: 4 },
            row: { start: 2, end: 3 },
          });

          expect(updates).toEqual([
            ["blue", { start: 2, end: 4 }],
            ["black", { start: 1, end: 3 }],
            ["red", { start: 3, end: 4 }],
          ]);
        });
      });
      describe("WHEN we shrink red horizontally", () => {
        it("THEN we update ", () => {
          const model = new GridLayoutModel(2, 2);
          model.addGridItem(new Item("green", 1, 2, 1, 2));
          model.addGridItem(new Item("blue", 2, 3, 1, 2));
          model.addGridItem(new Item("black", 1, 2, 2, 3));
          const redItem = new Item("red", 2, 3, 2, 3);
          model.addGridItem(redItem);

          const direction = "horizontal";
          const adjacentItems = model.getGridItemsAdjoiningTrack(
            "red",
            direction,
            "start"
          );
          const updates = model.repositionComponentsforResize(
            redItem,
            adjacentItems,
            direction,
            "shrink"
          );

          expect(model.getGridItem("green")).toEqual({
            id: "green",
            column: { start: 1, end: 2 },
            row: { start: 1, end: 2 },
          });
          expect(model.getGridItem("blue")).toEqual({
            id: "blue",
            column: { start: 2, end: 4 },
            row: { start: 1, end: 2 },
          });
          expect(model.getGridItem("black")).toEqual({
            id: "black",
            column: { start: 1, end: 3 },
            row: { start: 2, end: 3 },
          });
          expect(model.getGridItem("red")).toEqual({
            id: "red",
            column: { start: 3, end: 4 },
            row: { start: 2, end: 3 },
          });

          expect(updates).toEqual([
            ["black", { start: 1, end: 3 }],
            ["red", { start: 3, end: 4 }],
            ["blue", { start: 2, end: 4 }],
          ]);
        });
      });
    });
  });
});
