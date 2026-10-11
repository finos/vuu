import { describe, expect, it } from "vitest";
import {
  decodeExampleProps,
  defineExampleProps,
  describeActionArgs,
  effectivePropValue,
  encodeExampleProps,
  exampleToJsx,
  getExamplePropDefs,
  sanitiseExampleProps,
  withoutDefaults,
} from "../src/example-props";

const defs = defineExampleProps({
  columns: { type: "multiselect", options: ["ric", "price", "qty"] },
  label: { type: "string", default: "Instruments" },
  layout: { type: "select", options: ["static", "fit"], default: "static" },
  onSelect: { type: "action" },
  rowCount: { type: "number", default: 1000 },
  zebra: { type: "boolean", default: false },
});

describe("example-props", () => {
  it("round trips values through a url safe encoding", () => {
    const values = { label: "Prix €/£ ✓", rowCount: 50, columns: ["ric"] };
    const encoded = encodeExampleProps(values);
    expect(encoded).toMatch(/^[-_A-Za-z0-9]+$/);
    expect(decodeExampleProps(encoded)).toEqual(values);
  });
  it("encodes no values as an empty string, ignores invalid input", () => {
    expect(encodeExampleProps({})).toBe("");
    expect(decodeExampleProps("")).toEqual({});
    expect(decodeExampleProps("not*base64")).toEqual({});
    expect(decodeExampleProps(encodeExampleProps({ a: 1 }).slice(1))).toEqual(
      {},
    );
  });
  it("keeps only valid definitions", () => {
    expect(
      getExamplePropDefs({
        a: { type: "number" },
        b: { type: "select" },
        c: { type: "colour" },
        d: null,
      }),
    ).toEqual({ a: { type: "number" } });
    expect(getExamplePropDefs({ b: { type: "select" } })).toBeUndefined();
    expect(getExamplePropDefs([])).toBeUndefined();
    expect(getExamplePropDefs(undefined)).toBeUndefined();
  });
  it("drops values that don't match their definition", () => {
    expect(
      sanitiseExampleProps(defs, {
        columns: ["ric", "bid"],
        label: "x",
        layout: "fit",
        onSelect: "x",
        rowCount: "10",
        unknown: 1,
        zebra: true,
      }),
    ).toEqual({ label: "x", layout: "fit", zebra: true });
    expect(sanitiseExampleProps(defs, { rowCount: Number.NaN })).toEqual({});
  });
  it("removes values equal to their default", () => {
    expect(
      withoutDefaults(defs, {
        columns: [],
        layout: "static",
        rowCount: 10,
        zebra: false,
      }),
    ).toEqual({ rowCount: 10 });
  });
  it("shows the default when no value is set", () => {
    expect(effectivePropValue(defs.rowCount, undefined)).toBe(1000);
    expect(effectivePropValue(defs.rowCount, 5)).toBe(5);
    expect(effectivePropValue(defs.columns, undefined)).toEqual([]);
    expect(effectivePropValue(defs.onSelect, undefined)).toBeUndefined();
  });
  it("renders JSX, sorted, wrapping long lines", () => {
    expect(exampleToJsx("TestTable", {})).toBe("<TestTable />");
    expect(exampleToJsx("TestTable", { zebra: true, rowCount: 5 })).toBe(
      "<TestTable rowCount={5} zebra />",
    );
    expect(
      exampleToJsx("TestTable", {
        columns: ["ric", "price", "qty"],
        label: "A long label for the table",
        rowCount: 5,
      }),
    ).toBe(
      `<TestTable\n  columns={["ric","price","qty"]}\n  label="A long label for the table"\n  rowCount={5}\n/>`,
    );
  });
  it("describes callback arguments", () => {
    const circular: { self?: unknown } = {};
    circular.self = circular;
    expect(
      describeActionArgs([1, "a", { b: 2 }, undefined, () => 0, circular]),
    ).toBe('1, "a", {"b":2}, undefined, ƒ, [object Object]');
    expect(describeActionArgs([{ nativeEvent: {}, type: "click" }])).toBe(
      "click event",
    );
  });
});
