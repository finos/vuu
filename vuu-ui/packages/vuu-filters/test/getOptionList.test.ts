import { describe, expect, it } from "vitest";
import { getOptionList } from "../src/expando-combobox/option-list-utils";

const identity = (s: string) => s;
const ops = ["=", "in", "!=", "starts", "ends", "contains"];

describe("getOptionList", () => {
  it("lists all options when nothing has been typed", () => {
    expect(getOptionList(ops, identity, "")).toEqual(ops);
  });

  it("lists the current value first when nothing has been typed", () => {
    expect(getOptionList(ops, identity, "", "!=")).toEqual([
      "!=",
      "=",
      "in",
      "starts",
      "ends",
      "contains",
    ]);
  });

  it("filters by typed text, case insensitive, ignoring the current value", () => {
    expect(getOptionList(ops, identity, "S", "=")).toEqual([
      "starts",
      "ends",
      "contains",
    ]);
  });

  it("leaves the order unchanged when the current value is not an option", () => {
    expect(getOptionList(ops, identity, "", "XLON")).toEqual(ops);
  });

  it("matches the current value using getText", () => {
    const columns = [{ name: "bbg" }, { name: "currency" }];
    expect(getOptionList(columns, ({ name }) => name, "", "currency")).toEqual([
      { name: "currency" },
      { name: "bbg" },
    ]);
  });
});
