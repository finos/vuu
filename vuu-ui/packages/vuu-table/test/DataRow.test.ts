import { describe, expect, it } from "vitest";
import { dataRowFactory } from "../src/data-row/DataRow";

describe("DataRow", () => {
  it("Factory with no columns, DataRow has intrinsic properties ", () => {
    const [DataRow] = dataRowFactory([], []);
    const dataRow = DataRow([0, 0, false, false, 1, 0, "key-0", 0, 0, false]);

    expect(dataRow.childCount).toEqual(0);
    expect(dataRow.depth).toEqual(1);
    expect(dataRow.index).toEqual(0);
    expect(dataRow.isExpanded).toEqual(false);
    expect(dataRow.isLeaf).toEqual(false);
    expect(dataRow.isSelected).toEqual(0);
    expect(dataRow.key).toEqual("key-0");
    expect(dataRow.renderIndex).toEqual(0);
  });

  it("Factory uses columns to create DataRowFunc, column names are properties on the dataRow ", () => {
    const [DataRow] = dataRowFactory(
      ["bbg"],
      [{ name: "bbg", serverDataType: "string" }],
    );
    // prettier-ignore
    const dataRow = DataRow([0, 0, false, false, 1, 0, "key-0", 0, 0, false, "AAO L"]);
    expect(dataRow.bbg).toEqual("AAO L");
  });
  it("custom types that cannot be represented natively in JSON are transformed, scaleddecimal2", () => {
    const [DataRow] = dataRowFactory(
      ["price"],
      [{ name: "price", serverDataType: "scaleddecimal2" }],
    );
    // prettier-ignore
    const dataRow = DataRow([0, 0, false, false, 1, 0, "key-0", 0, 0, false, "123456789"]);
    expect(dataRow.price).toEqual("1234567.89");

    // prettier-ignore
    const dataRowNegativeValue = DataRow([0, 0, false, false, 1, 0, "key-0", 0, 0, false, "-123456789"]);
    expect(dataRowNegativeValue.price).toEqual("-1234567.89");

    // prettier-ignore
    const dataRowSmallValue = DataRow([0, 0, false, false, 1, 0, "key-0", 0, 0, false, "12"]);
    expect(dataRowSmallValue.price).toEqual("0.12");
  });
  it("custom types that cannot be represented natively in JSON are transformed, scaleddecimal4", () => {
    const [DataRow] = dataRowFactory(
      ["price"],
      [{ name: "price", serverDataType: "scaleddecimal4" }],
    );
    // prettier-ignore
    const dataRow = DataRow([0, 0, false, false, 1, 0, "key-0", 0, 0, false, "123456789"]);
    expect(dataRow.price).toEqual("12345.6789");

    // prettier-ignore
    const dataRowNegativeValue = DataRow([0, 0, false, false, 1, 0, "key-0", 0, 0, false, "-123456789"]);
    expect(dataRowNegativeValue.price).toEqual("-12345.6789");

    // prettier-ignore
    const dataRowSmallValue = DataRow([0, 0, false, false, 1, 0, "key-0", 0, 0, false, "12"]);
    expect(dataRowSmallValue.price).toEqual("0.0012");
  });
  it("custom types that cannot be represented natively in JSON are transformed, scaleddecimal6", () => {
    const [DataRow] = dataRowFactory(
      ["price"],
      [{ name: "price", serverDataType: "scaleddecimal6" }],
    );
    // prettier-ignore
    const dataRow = DataRow([0, 0, false, false, 1, 0, "key-0", 0, 0, false, "123456789"]);
    expect(dataRow.price).toEqual("123.456789");

    // prettier-ignore
    const dataRowNegativeValue = DataRow([0, 0, false, false, 1, 0, "key-0", 0, 0, false, "-123456789"]);
    expect(dataRowNegativeValue.price).toEqual("-123.456789");

    // prettier-ignore
    const dataRowSmallValue = DataRow([0, 0, false, false, 1, 0, "key-0", 0, 0, false, "-12"]);
    expect(dataRowSmallValue.price).toEqual("-0.000012");
  });
  it("custom types that cannot be represented natively in JSON are transformed, scaleddecimal8", () => {
    const [DataRow] = dataRowFactory(
      ["price"],
      [{ name: "price", serverDataType: "scaleddecimal8" }],
    );
    // prettier-ignore
    const dataRow = DataRow([0, 0, false, false, 1, 0, "key-0", 0, 0, false, "123456789"]);
    expect(dataRow.price).toEqual("1.23456789");

    // prettier-ignore
    const dataRowNegativeValue = DataRow([0, 0, false, false, 1, 0, "key-0", 0, 0, false, "-123456789"]);
    expect(dataRowNegativeValue.price).toEqual("-1.23456789");
  });
});
