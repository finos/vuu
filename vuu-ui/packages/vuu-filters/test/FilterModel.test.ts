import { FilterModel, FilterClauseModel } from "../src/FilterModel";
import { describe, expect, it } from "vitest";
import { Filter } from "@finos/vuu-filter-types";

const simpleEqualsFilter: Filter = {
  column: "ccy",
  op: "=",
  value: "EUR",
};
const simpleGTFilter: Filter = {
  column: "price",
  op: ">",
  value: 1000,
};

const AndFilter: Filter = {
  op: "and",
  filters: [simpleEqualsFilter, simpleGTFilter],
};

describe("FilterModel", () => {
  describe("WHEN initially created", () => {
    describe("AND no content provided", () => {
      it("THEN filterModel has single filterclause", () => {
        const filterModel = new FilterModel();
        expect(filterModel.filterClauses.length).toEqual(1);
      });
      it("THEN filter is invalid and filter clause is invalid", () => {
        const filterModel = new FilterModel();
        expect(filterModel.isValid).toEqual(false);
        const firstClause = filterModel.getFilterClause(0);
        expect(firstClause?.isValid).toEqual(false);
      });
      it("THEN attempt to getJSON throws", () => {
        const filterModel = new FilterModel();
        expect(() => filterModel.asFilter()).toThrow();
      });
      describe("WHEN filterclause updated, but still incomplete", () => {
        it("THEN both filter clause and filter are invalid", () => {
          const filterModel = new FilterModel();
          const [filterClause] = filterModel.filterClauses;
          (filterClause as FilterClauseModel).column = "currency";
          expect(filterModel.isValid).toEqual(false);
          expect(filterClause.isValid).toEqual(false);
          (filterClause as FilterClauseModel).setOp("=");
          expect(filterModel.isValid).toEqual(false);
          expect(filterClause.isValid).toEqual(false);
        });
      });
      describe("WHEN a filter clause is updated so that all properties on a filterclause are present", () => {
        it("THEN both filter clause and filter are valid", () => {
          const filterModel = new FilterModel();
          const [filterClause] = filterModel.filterClauses;
          (filterClause as FilterClauseModel).column = "currency";
          (filterClause as FilterClauseModel).setOp("=");
          (filterClause as FilterClauseModel).setValue("EUR");
          expect(filterModel.isValid).toEqual(true);
          expect(filterClause.isValid).toEqual(true);
        });
      });
    });
    describe("AND simple but complete filterclause is provided", () => {
      it("THEN filterModel has single filterclause", () => {
        const filterModel = new FilterModel(simpleEqualsFilter);
        expect(filterModel.filterClauses.length).toEqual(1);
      });
      it("THEN filter is valid and filterclause is valid", () => {
        const filterModel = new FilterModel(simpleEqualsFilter);
        expect(filterModel.isValid).toEqual(true);
        const firstClause = filterModel.getFilterClause(0);
        expect(firstClause?.isValid).toEqual(true);
      });
      it("THEN filter structure matches input", () => {
        const filterModel = new FilterModel(simpleEqualsFilter);
        expect(filterModel.asFilter()).toEqual(simpleEqualsFilter);
      });
    });
    describe("AND complete multi clause filterclause is provided", () => {
      it("THEN filterModel has single filterclause", () => {
        const filterModel = new FilterModel(AndFilter);
        expect(filterModel.op).toEqual("and");
        expect(filterModel.filterClauses.length).toEqual(2);
      });
      it("THEN filter is valid and filterclause is valid", () => {
        const filterModel = new FilterModel(AndFilter);
        expect(filterModel.isValid).toEqual(true);
        const firstClause = filterModel.getFilterClause(0);
        expect(firstClause?.isValid).toEqual(true);
        const secondClause = filterModel.getFilterClause(1);
        expect(secondClause?.isValid).toEqual(true);
      });
      it("THEN filter structure matches input", () => {
        const filterModel = new FilterModel(AndFilter);
        expect(filterModel.asFilter()).toEqual(AndFilter);
      });
    });
    // describe("AND complete multi clause filterclause with nested structure is provided", () => {
    //   const filter: Filter = {
    //     op: "and",
    //     filters: [
    //       simpleEqualsFilter,
    //       {
    //         op: "or",
    //         filters: [
    //           simpleGTFilter,
    //           { column: "price", op: "<", value: 2000 },
    //         ],
    //       },
    //     ],
    //   };
    //   it("THEN filterModel has single filterclause", () => {
    //     const filterModel = new FilterModel(filter);
    //     expect(filterModel.op).toEqual("and");
    //     expect(filterModel.filterClauses.length).toEqual(2);
    //   });
    //   it("THEN filter is valid and filterclause is valid", () => {
    //     const filterModel = new FilterModel(filter);
    //     expect(filterModel.isValid).toEqual(true);
    //     const firstClause = filterModel.getFilterClause(0);
    //     expect(firstClause?.isValid).toEqual(true);
    //     const secondClause = filterModel.getFilterClause(1);
    //     expect(secondClause?.isValid).toEqual(true);
    //   });
    //   it("THEN filter structure matches input", () => {
    //     const filterModel = new FilterModel(filter);
    //     expect(filterModel.asFilter()).toEqual(filter);
    //   });
    // });
  });
});
