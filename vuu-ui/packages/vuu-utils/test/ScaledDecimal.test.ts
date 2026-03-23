import { describe, expect, it } from "vitest";
import {
  ScaledDecimal2,
  ScaledDecimal4,
  ScaledDecimal6,
  ScaledDecimal8,
} from "../src/ScaledDecimal";

describe("ScaledDdecimal", () => {
  it("represents a scaleddecimal type of 2 digit decimal precision", () => {
    const scaledDecimal = ScaledDecimal2("20.4");
    expect(`${scaledDecimal}`).toEqual("20.4");
    expect(scaledDecimal.asLong).toEqual("2040");
  });
  it("represents a scaleddecimal type of 4 digit decimal precision", () => {
    const scaledDecimal = ScaledDecimal4("20.4");
    expect(`${scaledDecimal}`).toEqual("20.4");
    expect(scaledDecimal.asLong).toEqual("204000");
  });
  it("represents a scaleddecimal type of 6 digit decimal precision", () => {
    const scaledDecimal = ScaledDecimal6("20.4");
    expect(`${scaledDecimal}`).toEqual("20.4");
    expect(scaledDecimal.asLong).toEqual("20400000");
  });
  it("represents a scaleddecimal type of 8 digit decimal precision", () => {
    const scaledDecimal = ScaledDecimal8("20.4");
    expect(`${scaledDecimal}`).toEqual("20.4");
    expect(scaledDecimal.asLong).toEqual("2040000000");
  });
});
