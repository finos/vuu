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
        model.addGridItem(new Item("brown", 2, 3, 1, 2));

        const splitters = model.getSplitterPositions();
        // prettier-ignore
        expect(splitters).toEqual([
            {align: "start", id: "brown-splitter-h", orientation: "horizontal", controls: "brown", column: {start: 2, end: 3}, row: {start: 1, end: 2}},
        ])
      });
    });
    describe("WHEN we have a 1 x 2 layout", () => {
      it("THEN we have 1 initial splitter", () => {
        const model = new GridLayoutModel(1, 2);
        model.addGridItem(new Item("green", 1, 2, 1, 2));
        model.addGridItem(new Item("brown", 1, 2, 2, 3));

        const splitters = model.getSplitterPositions();
        // prettier-ignore
        expect(splitters).toEqual([
            {align: "start", id: "brown-splitter-v", orientation: "vertical", controls: "brown", column: {start: 1, end: 2}, row: {start: 2, end: 3}},
        ])
      });
    });
    describe("WHEN we have a 2 x 2 layout", () => {
      it("THEN we have 4 initial splitters", () => {
        const model = new GridLayoutModel(2, 2);
        model.addGridItem(new Item("green", 1, 2, 1, 2));
        model.addGridItem(new Item("brown", 2, 3, 1, 2));
        model.addGridItem(new Item("black", 1, 2, 2, 3));
        model.addGridItem(new Item("yellow", 2, 3, 2, 3));

        const splitters = model.getSplitterPositions();
        // prettier-ignore
        expect(splitters).toEqual([
            {align: "start", id: "brown-splitter-h", orientation: "horizontal", controls: "brown", column: {start: 2, end: 3}, row: {start: 1, end: 2}},
            {align: "start", id: "black-splitter-v", orientation: "vertical", controls: "black", column: {start: 1, end: 2}, row: {start: 2, end: 3}},
            {align: "start", id: "yellow-splitter-h", orientation: "horizontal", controls: "yellow", column: {start: 2, end: 3}, row: {start: 2, end: 3}},
            {align: "start", id: "yellow-splitter-v", orientation: "vertical", controls: "yellow", column: {start: 2, end: 3}, row: {start: 2, end: 3}}
        ])
      });
    });

    describe("WHEN we have  2 columns, with 2 rows in the first column", () => {
      it("THEN we have a splitter that spans two rows", () => {
        const model = new GridLayoutModel(2, 2);
        model.addGridItem(new Item("green", 1, 2, 1, 2));
        model.addGridItem(new Item("brown", 2, 3, 1, 3));
        model.addGridItem(new Item("yellow", 1, 2, 2, 3));

        const splitters = model.getSplitterPositions();
        // prettier-ignore
        expect(splitters).toEqual([
              {align: "start", id: "brown-splitter-h", orientation: "horizontal", controls: "brown", column: {start: 2, end: 3}, row: {start: 1, end: 3}},
              {align: "start", id: "yellow-splitter-v", orientation: "vertical", controls: "yellow", column: {start: 1, end: 2}, row: {start: 2, end: 3}}
          ])
      });
    });

    describe("WHEN we have  2 columns, with 2 rows in the second column", () => {
      it("THEN we have a splitter that spans two rows, align end", () => {
        const model = new GridLayoutModel(2, 2);
        model.addGridItem(new Item("green", 1, 2, 1, 3));
        model.addGridItem(new Item("brown", 2, 3, 1, 2));
        model.addGridItem(new Item("yellow", 2, 3, 2, 3));

        const splitters = model.getSplitterPositions();
        // prettier-ignore
        expect(splitters).toEqual([
            {align: "end", id: "green-splitter-h", orientation: "horizontal", controls: "green", column: {start: 1, end: 2}, row: {start: 1, end: 3}},
            {align: "start", id: "yellow-splitter-v", orientation: "vertical", controls: "yellow", column: {start: 2, end: 3}, row: {start: 2, end: 3}}
        ])
      });
    });

    describe("WHEN we have  2 rows, with 2 columns in the first column", () => {
      it("THEN we have a splitter that spans two rows", () => {
        const model = new GridLayoutModel(2, 2);
        model.addGridItem(new Item("green", 1, 2, 1, 2));
        model.addGridItem(new Item("brown", 2, 3, 1, 2));
        model.addGridItem(new Item("yellow", 1, 3, 2, 3));

        const splitters = model.getSplitterPositions();
        // prettier-ignore
        expect(splitters).toEqual([
              {align: "start", id: "brown-splitter-h", orientation: "horizontal", controls: "brown", column: {start: 2, end: 3}, row: {start: 1, end: 2}},
              {align: "start", id: "yellow-splitter-v", orientation: "vertical", controls: "yellow", column: {start: 1, end: 3}, row: {start: 2, end: 3}}
          ])
      });
    });
    describe("WHEN we have  2 rows, with 2 columns in the second column", () => {
      it("THEN we have a splitter that spans two rows, align end", () => {
        const model = new GridLayoutModel(2, 2);
        model.addGridItem(new Item("green", 1, 3, 1, 2));
        model.addGridItem(new Item("brown", 1, 2, 2, 3));
        model.addGridItem(new Item("yellow", 2, 3, 2, 3));

        const splitters = model.getSplitterPositions();
        // prettier-ignore
        expect(splitters).toEqual([
            {align: "end", id: "green-splitter-v", orientation: "vertical", controls: "green", column: {start: 1, end: 3}, row: {start: 1, end: 2}},
            {align: "start", id: "yellow-splitter-h", orientation: "horizontal", controls: "yellow", column: {start: 2, end: 3}, row: {start: 2, end: 3}}
        ])
      });
    });
    describe("WHEN we have a 2 x 2 layout, 2 columns, misaligned rows, aligned top", () => {
      it("THEN we have 3 initial splitters, including a multi-track splitter", () => {
        const model = new GridLayoutModel(2, 3);
        model.addGridItem(new Item("green", 1, 2, 1, 2));
        model.addGridItem(new Item("brown", 2, 3, 1, 3));
        model.addGridItem(new Item("black", 1, 2, 2, 4));
        model.addGridItem(new Item("yellow", 2, 3, 3, 4));

        const splitters = model.getSplitterPositions();
        // prettier-ignore
        expect(splitters).toEqual([
          {align: "start", id: "brown-splitter-h", orientation: "horizontal", controls: "brown", column: {start: 2, end: 3}, row: {start: 1, end: 4}},
          {align: "start", id: "black-splitter-v", orientation: "vertical", controls: "black", column: {start: 1, end: 2}, row: {start: 2, end: 4}},
            {align: "start", id: "yellow-splitter-v", orientation: "vertical", controls: "yellow", column: {start: 2, end: 3}, row: {start: 3, end: 4}}
        ])
      });
    });

    describe("WHEN we have a 2 x 2 layout, 2 columns, misaligned rows, aligned bottom", () => {
      it("THEN we have 3 initial splitters, including a multi-track splitter", () => {
        const model = new GridLayoutModel(2, 3);
        model.addGridItem(new Item("green", 1, 2, 1, 3));
        model.addGridItem(new Item("brown", 2, 3, 1, 2));
        model.addGridItem(new Item("black", 1, 2, 3, 4));
        model.addGridItem(new Item("yellow", 2, 3, 2, 4));

        const splitters = model.getSplitterPositions();
        // prettier-ignore
        expect(splitters).toEqual([
          {align: "start", id: "black-splitter-v", orientation: "vertical", controls: "black", column: {start: 1, end: 2}, row: {start: 3, end: 4}},
          {align: "start", id: "yellow-splitter-h", orientation: "horizontal", controls: "yellow", column: {start: 2, end: 3}, row: {start: 1, end: 4}},
          {align: "start", id: "yellow-splitter-v", orientation: "vertical", controls: "yellow", column: {start: 2, end: 3}, row: {start: 2, end: 4}},
        ])
      });
    });
  });

  describe("getGridItemsAdjoiningTrack", () => {
    describe("WHEN we have a 2 x 1 layout", () => {
      it("THEN first cell is horizontal contra for second cell", () => {
        const model = new GridLayoutModel(2, 1);
        model.addGridItem(new Item("green", 1, 2, 1, 2));
        model.addGridItem(new Item("brown", 2, 3, 1, 2));

        const { contra, contraOtherTrack } = model.getGridItemsAdjoiningTrack(
          "brown",
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
        model.addGridItem(new Item("brown", 1, 2, 2, 3));

        const { contra, contraOtherTrack } = model.getGridItemsAdjoiningTrack(
          "brown",
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
    model.addGridItem(new Item("brown", 2, 3, 1, 2));
    model.addGridItem(new Item("black", 1, 2, 2, 3));
    model.addGridItem(new Item("yellow", 2, 3, 2, 3));

    it("THEN first row first cell is horizontal contra for first row second cell", () => {
      const { contra, contraOtherTrack, siblingsOtherTrack, nonAdjacent } =
        model.getGridItemsAdjoiningTrack("brown", "horizontal", "start");

      expect(contra.length).toEqual(1);
      expect(contraOtherTrack?.length).toEqual(1);
      expect(siblingsOtherTrack?.length).toEqual(1);
      expect(nonAdjacent?.length).toEqual(0);

      const [contraItem] = contra;
      expect(contraItem.id).toEqual("green");
    });

    it("THEN second row first cell is horizontal contra for second row second cell", () => {
      const { contra, contraOtherTrack, siblingsOtherTrack, nonAdjacent } =
        model.getGridItemsAdjoiningTrack("yellow", "horizontal", "start");

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
        model.getGridItemsAdjoiningTrack("yellow", "vertical", "start");

      expect(contra.length).toEqual(1);
      expect(contraOtherTrack?.length).toEqual(1);
      expect(siblingsOtherTrack?.length).toEqual(1);
      expect(nonAdjacent?.length).toEqual(0);

      const [contraItem] = contra;
      expect(contraItem.id).toEqual("brown");
    });
  });
  describe("WHEN we have  2 columns, with 2 rows in the second column", () => {
    it("THEN we have a simple resize, with multiple contras", () => {
      const model = new GridLayoutModel(2, 2);
      model.addGridItem(new Item("green", 1, 2, 1, 3));
      model.addGridItem(new Item("brown", 2, 3, 1, 2));
      model.addGridItem(new Item("yellow", 2, 3, 2, 3));

      const { contra, contraOtherTrack, siblingsOtherTrack, nonAdjacent } =
        model.getGridItemsAdjoiningTrack("green", "horizontal", "end");

      expect(contra.length).toEqual(2);
    });
  });
});
