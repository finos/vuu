import { describe, expect, it } from "vitest";
import {
  MultiClauseFilter,
  MultiValueFilterClause,
} from "@finos/vuu-filter-types";
import { getFilterLabel } from "../../src/filter-pill/getFilterLabel";

describe("getFilterLabel", () => {
  it("can get correct label for a single value non-date filter", () => {
    const f = { op: "=", column: "isSupported", value: true } as const;
    const label = getFilterLabel()(f);
    expect(label).toEqual("isSupported = true");
  });

  it("can get correct label for a single value date filter", () => {
    const date = new Date("2022-05-10");
    const f = { op: ">", column: "date", value: date.getTime() } as const;
    const label = getFilterLabel({ date: { name: "date", type: "date/time" } })(
      f
    );
    expect(label).toEqual('date > "10.05.2022"');
  });

  it("can get correct label for a multi value filter", () => {
    const f: MultiValueFilterClause = {
      op: "in",
      column: "name",
      values: ["vuu", "finos"],
    };
    const label = getFilterLabel()(f);
    expect(label).toEqual('name in ["vuu","finos"]');
  });

  it("can get correct label for a multi clause filter", () => {
    const f: MultiClauseFilter = {
      op: "and",
      filters: [
        { column: "A", value: 1, op: ">" },
        { column: "B", value: "b", op: "starts" },
      ],
    };
    const label = getFilterLabel()(f);
    expect(label).toEqual("A > 1 and ...");
  });
});
