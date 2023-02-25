import { describe, expect, it } from "vitest";
import { parser } from "../src/column-expression-input/column-language-parser/generated/column-parser";

const strictParser = parser.configure({ strict: true });

const Ok = "ok";
const NotOk = "not ok";

const evaluateExpression = (filter: string) => {
  try {
    strictParser.parse(filter);
    return Ok;
  } catch (err) {
    return NotOk;
  }
};

describe("ColumnExpressionParser", () => {
  // it("rejects invalid columns expressions", () => {
  //   expect(evaluateFilter("currency EUR")).toEqual(NotOk);
  //   expect(evaluateFilter('currency "EUR"')).toEqual(NotOk);
  //   expect(evaluateFilter('currency = "EUR')).toEqual(NotOk);
  //   expect(evaluateFilter("currency = EUR")).toEqual(NotOk);
  //   expect(evaluateFilter("price = 1.")).toEqual(NotOk);
  //   expect(evaluateFilter("price = 1.2.3")).toEqual(NotOk);
  // });

  it("parses a simple column", () => {
    expect(evaluateExpression("bid")).toEqual(Ok);
  });

  it("parses a literal", () => {
    expect(evaluateExpression("100")).toEqual(Ok);
    expect(evaluateExpression('"test"')).toEqual(Ok);
    expect(evaluateExpression("true")).toEqual(Ok);
  });

  it("allows any characters in strings", () => {
    expect(evaluateExpression('"test-100/300 is ***"')).toEqual(Ok);
  });

  it("parses a two column math operation", () => {
    expect(evaluateExpression("price * quantity")).toEqual(Ok);
    expect(evaluateExpression("price*quantity")).toEqual(Ok);
    expect(evaluateExpression("price / quantity")).toEqual(Ok);
    expect(evaluateExpression("price + quantity")).toEqual(Ok);
    expect(evaluateExpression("quantity - filledQuantity")).toEqual(Ok);
  });

  it("parses function calls", () => {
    expect(evaluateExpression("min(i1, i2)")).toEqual(Ok);
    expect(evaluateExpression("max(100,100,200)")).toEqual(Ok);
    expect(evaluateExpression("right(client,3)")).toEqual(Ok);
    expect(
      evaluateExpression('concatenate(currency, " -- ", exchange)')
    ).toEqual(Ok);
  });

  it("parses multi operand math expressions", () => {
    expect(evaluateExpression("price * quantity * bid")).toEqual(Ok);
    expect(evaluateExpression("bid*100+price-50")).toEqual(Ok);
  });

  it("recognizes braces used to manage precedence ", () => {
    expect(evaluateExpression("bid+(price*quantity)")).toEqual(Ok);
    expect(evaluateExpression("(price*quantity)*bid")).toEqual(Ok);
    expect(evaluateExpression("(bid*ask)+(price-quantity)")).toEqual(Ok);
  });

  it("parses nested function calls", () => {
    expect(evaluateExpression("min(min(i1, i3), i2)")).toEqual(Ok);
    expect(
      evaluateExpression("concatenate(max(i1, i2), text(quantity))")
    ).toEqual(Ok);
  });

  it("parses conditional expressions", () => {
    expect(evaluateExpression("if(price > 100, true, false)")).toEqual(Ok);
    expect(evaluateExpression('if(side="Sell","N","Y")')).toEqual(Ok);
    expect(evaluateExpression('if(ask < bid,"N","Y")')).toEqual(Ok);
  });

  it("parses nested conditional expressions", () => {
    expect(evaluateExpression('if(ccy="Gbp",1,if(ccy="USD",2,3))')).toEqual(Ok);
  });
});
