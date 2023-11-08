import { describe, expect, it } from "vitest";
import { parser } from "../src/column-expression-input/column-language-parser/generated/column-parser";
import { walkTree } from "../src/column-expression-input/column-language-parser/ColumnExpressionTreeWalker";

describe("Column Expression treeWalker", () => {
  it("parses number literal values", () => {
    const str = "100";
    const result = parser.parse(str);
    const expression = walkTree(result, str);
    expect(expression).toEqual({
      type: "numericLiteralExpression",
      value: 100,
    });
  });
  it("parses boolean literal values", () => {
    const str = "true";
    const result = parser.parse(str);
    const expression = walkTree(result, str);
    expect(expression).toEqual({
      type: "booleanLiteralExpression",
      value: true,
    });
  });

  it("parses a column expression", () => {
    const str = "currency";
    const result = parser.parse(str);
    const expression = walkTree(result, str);
    expect(expression).toEqual({
      column: "currency",
      type: "colExpression",
    });
  });

  it("parses a two column arithmetic expression", () => {
    const str = "price * quantity";
    const result = parser.parse(str);
    const expression = walkTree(result, str);

    expect(expression).toEqual({
      expressions: [
        { column: "price", type: "colExpression" },
        { column: "quantity", type: "colExpression" },
      ],
      op: "*",
      type: "arithmeticExpression",
    });
  });

  it("parses a binary expression with a column and a numeric literal", () => {
    const str = "price / 100";
    const result = parser.parse(str);
    const expression = walkTree(result, str);

    expect(expression).toEqual({
      expressions: [
        { column: "price", type: "colExpression" },
        { value: 100, type: "numericLiteralExpression" },
      ],
      op: "/",
      type: "arithmeticExpression",
    });
  });

  it("parses am arithmetic expression with a numeric literal and a column", () => {
    const str = "100  * price";
    const result = parser.parse(str);
    const expression = walkTree(result, str);
    expect(expression).toEqual({
      expressions: [
        { value: 100, type: "numericLiteralExpression" },
        { column: "price", type: "colExpression" },
      ],
      op: "*",
      type: "arithmeticExpression",
    });
  });

  it("parses a simple function call", () => {
    const str = "concatenate(currency, exchange)";
    const result = parser.parse(str);
    const expression = walkTree(result, str);

    expect(expression).toEqual({
      arguments: [
        { column: "currency", type: "colExpression" },
        { column: "exchange", type: "colExpression" },
      ],
      functionName: "concatenate",
      type: "callExpression",
    });
  });

  it("parses arguments of different types", () => {
    const str = "left(description, 20)";
    const result = parser.parse(str);
    const expression = walkTree(result, str);
    expect(expression).toEqual({
      arguments: [
        { column: "description", type: "colExpression" },
        { value: 20, type: "numericLiteralExpression" },
      ],
      functionName: "left",
      type: "callExpression",
    });
  });

  it("parses call expressions with more than two arguments", () => {
    const str = "max(open, close, 1000)";
    const result = parser.parse(str);
    const expression = walkTree(result, str);
    expect(expression).toEqual({
      arguments: [
        { column: "open", type: "colExpression" },
        { column: "close", type: "colExpression" },
        { value: 1000, type: "numericLiteralExpression" },
      ],
      functionName: "max",
      type: "callExpression",
    });
  });

  it("parses nested function calls", () => {
    const str = "min(min(i1, i3), i2)";
    const result = parser.parse(str);
    const expression = walkTree(result, str);

    expect(expression).toEqual({
      type: "callExpression",
      functionName: "min",
      arguments: [
        {
          type: "callExpression",
          functionName: "min",
          arguments: [
            { column: "i1", type: "colExpression" },
            { column: "i3", type: "colExpression" },
          ],
        },
        { column: "i2", type: "colExpression" },
      ],
    });
  });

  it("parses deeply nested function calls", () => {
    const str = "min(min(i1, i3, max(iA, iB)), i2)";
    const result = parser.parse(str);
    const expression = walkTree(result, str);
    expect(expression).toEqual({
      arguments: [
        {
          arguments: [
            { column: "i1", type: "colExpression" },
            { column: "i3", type: "colExpression" },
            {
              arguments: [
                { column: "iA", type: "colExpression" },
                { column: "iB", type: "colExpression" },
              ],
              functionName: "max",
              type: "callExpression",
            },
          ],
          functionName: "min",
          type: "callExpression",
        },
        { column: "i2", type: "colExpression" },
      ],
      functionName: "min",
      type: "callExpression",
    });
  });

  describe("conditionalExpressions", () => {
    it("parses conditional expressions with literal values", () => {
      const str = "if(price > 100, true, false)";
      const result = parser.parse(str);
      const expression = walkTree(result, str);

      expect(expression).toEqual({
        condition: {
          type: "relationalExpression",
          op: ">",
          expressions: [
            {
              column: "price",
              type: "colExpression",
            },
            {
              type: "numericLiteralExpression",
              value: 100,
            },
          ],
        },
        truthyExpression: {
          type: "booleanLiteralExpression",
          value: true,
        },
        falsyExpression: {
          type: "booleanLiteralExpression",
          value: false,
        },
        type: "conditionalExpression",
      });
    });
    it("parses conditional expressions with column values", () => {
      const str = "if(close > 200, close, open)";
      const result = parser.parse(str);
      const expression = walkTree(result, str);

      expect(expression).toEqual({
        condition: {
          type: "relationalExpression",
          op: ">",
          expressions: [
            { column: "close", type: "colExpression" },
            {
              type: "numericLiteralExpression",
              value: 200,
            },
          ],
        },
        truthyExpression: {
          column: "close",
          type: "colExpression",
        },
        falsyExpression: {
          column: "open",
          type: "colExpression",
        },
        type: "conditionalExpression",
      });
    });
    it("parses conditional expressions with boolean conditions", () => {
      const str = 'if(bid > 100 and bid <= 200, "in range", "out of range")';
      const result = parser.parse(str);
      const expression = walkTree(result, str);
      expect(expression).toEqual({
        type: "conditionalExpression",
        condition: {
          type: "booleanCondition",
          op: "and",
          expressions: [
            {
              type: "relationalExpression",
              op: ">",
              expressions: [
                { column: "bid", type: "colExpression" },
                {
                  type: "numericLiteralExpression",
                  value: 100,
                },
              ],
            },
            {
              type: "relationalExpression",
              op: "<=",
              expressions: [
                { column: "bid", type: "colExpression" },
                {
                  type: "numericLiteralExpression",
                  value: 200,
                },
              ],
            },
          ],
        },
        truthyExpression: {
          value: "in range",
          type: "stringLiteralExpression",
        },
        falsyExpression: {
          value: "out of range",
          type: "stringLiteralExpression",
        },
      });
    });

    it("parses nested conditional expressions", () => {
      const str = 'if(price > 100, "high", if (price > 50 , "medium", "low"))';
      const result = parser.parse(str);
      const expression = walkTree(result, str);

      expect(expression).toEqual({
        type: "conditionalExpression",
        condition: {
          type: "relationalExpression",
          op: ">",
          expressions: [
            { column: "price", type: "colExpression" },
            {
              type: "numericLiteralExpression",
              value: 100,
            },
          ],
        },
        truthyExpression: {
          type: "stringLiteralExpression",
          value: "high",
        },
        falsyExpression: {
          type: "conditionalExpression",
          condition: {
            type: "relationalExpression",
            op: ">",
            expressions: [
              { column: "price", type: "colExpression" },
              {
                type: "numericLiteralExpression",
                value: 50,
              },
            ],
          },
          truthyExpression: {
            type: "stringLiteralExpression",
            value: "medium",
          },
          falsyExpression: {
            type: "stringLiteralExpression",
            value: "low",
          },
        },
      });
    });
    it("parses conditional expressions with compound boolean conditions", () => {
      const str =
        'if(bid > 100 and bid <= 200 and bid != 150, "in range", "out of range")';
      const result = parser.parse(str);
      const expression = walkTree(result, str);

      expect(expression).toEqual({
        type: "conditionalExpression",
        condition: {
          type: "booleanCondition",
          op: "and",
          expressions: [
            {
              type: "booleanCondition",
              op: "and",
              expressions: [
                {
                  type: "relationalExpression",
                  op: ">",
                  expressions: [
                    { column: "bid", type: "colExpression" },
                    {
                      type: "numericLiteralExpression",
                      value: 100,
                    },
                  ],
                },
                {
                  type: "relationalExpression",
                  op: "<=",
                  expressions: [
                    { column: "bid", type: "colExpression" },
                    {
                      type: "numericLiteralExpression",
                      value: 200,
                    },
                  ],
                },
              ],
            },
            {
              type: "relationalExpression",
              op: "!=",
              expressions: [
                { column: "bid", type: "colExpression" },
                {
                  type: "numericLiteralExpression",
                  value: 150,
                },
              ],
            },
          ],
        },
        truthyExpression: {
          value: "in range",
          type: "stringLiteralExpression",
        },
        falsyExpression: {
          value: "out of range",
          type: "stringLiteralExpression",
        },
      });
    });
  });

  it.skip("parses and expressions with boolean conditions", () => {
    const str = 'and(bid > 100, currency="EUR")';
    const result = parser.parse(str);
    const expression = walkTree(result, str);
    expect(expression).toEqual({
      type: "callExpression",
      functionName: "and",
      arguments: [
        { type: "relationalExpression" },
        { type: "relationalExpression" },
      ],
    });
  });
});

// expect(evaluateExpression('if(side="Sell","N","Y")')).toEqual(Ok);
// expect(evaluateExpression('if(ccy="Gbp",1,if(ccy="USD",2,3))')).toEqual(Ok);
