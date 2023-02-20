import { Tree } from "@lezer/common";
type expressionType =
  | "colExpression"
  | "booleanLiteralExpression"
  | "numberLiteralExpression"
  | "stringLiteralExpression"
  | "callExpression"
  | "binaryExpression"
  | "booleanExpression"
  | "conditionalExpression";

type binaryOp = "*" | "/" | "+" | "-";
type booleanOp = "=" | "!=" | ">" | ">=" | "<" | "<=";

export interface Expression {
  type: expressionType;
  value?: string | number | boolean;
}

interface BinaryExpression extends Expression {
  expressions: [Expression, Expression];
  op: binaryOp;
  type: "callExpression";
}

interface BooleanExpression extends Expression {
  expressions: [Expression, Expression];
  op: booleanOp;
  type: "booleanExpression";
}

interface ColExpression extends Expression {
  column?: string;
  type: "colExpression";
}

interface CallExpression extends Expression {
  arguments: Expression[];
  functionName?: string;
  type: "callExpression";
}

interface ConditionalExpression extends Expression {
  condition: BooleanExpression;
  expressions: [Expression, Expression];
  type: "conditionalExpression";
}

const isBinaryExpression = (
  expression: Expression
): expression is BinaryExpression => expression.type === "binaryExpression";
const isCallExpression = (
  expression: Expression
): expression is CallExpression => expression.type === "callExpression";
const isConditionalExpression = (
  expression: Expression
): expression is ConditionalExpression =>
  expression.type === "conditionalExpression";

//TODO still does not fully support deeply nested expressions
class ColumnExpression {
  #expression: Expression | undefined;
  #callStack: CallExpression[] = [];

  setCondition() {
    const conditionExpression: ConditionalExpression = {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      expressions: [],
      type: "conditionalExpression",
    };
    this.addExpression(conditionExpression);
  }

  private addExpression(expression: Expression) {
    if (this.#callStack.length > 0) {
      const currentCallExpression = this.#callStack.at(-1);
      currentCallExpression?.arguments.push(expression);
    } else if (this.#expression === undefined) {
      this.#expression = expression;
    } else if (isBinaryExpression(this.#expression)) {
      this.#expression.expressions.push(expression);
    } else if (isConditionalExpression(this.#expression)) {
      const { condition, expressions } = this.#expression;
      if (condition === undefined) {
        const booleanExpression: BooleanExpression = {
          type: "booleanExpression",
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          expressions: [expression],
        };
        this.#expression.condition = booleanExpression;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
      } else if (condition.expressions.length === 1) {
        condition.expressions.push(expression);
      } else {
        expressions.push(expression);
      }
    }
  }

  setFunction(value: string) {
    const callExpression: CallExpression = {
      arguments: [],
      functionName: value,
      type: "callExpression",
    };
    this.addExpression(callExpression);
    this.#callStack.push(callExpression);
  }

  setColumn(columnName: string) {
    const columnExpression: ColExpression = {
      type: "colExpression",
      column: columnName,
    };
    this.addExpression(columnExpression);
  }

  setOp(value: string) {
    const op = value as binaryOp;
    if (
      this.#expression?.type === "colExpression" ||
      this.#expression?.type === "numberLiteralExpression" ||
      this.#expression?.type === "stringLiteralExpression"
    ) {
      this.#expression = {
        op,
        type: "binaryExpression",
        expressions: [this.#expression],
      } as unknown as BinaryExpression;
    }
  }

  setBooleanOperator(value: string) {
    const op = value as booleanOp;
    if (this.#expression && isConditionalExpression(this.#expression)) {
      this.#expression.condition.op = op;
    }
  }

  private getTypeLiteralType(type: string | number | boolean) {
    if (typeof type === "boolean") {
      return "booleanLiteralExpression";
    } else if (typeof type === "number") {
      return "numberLiteralExpression";
    } else {
      return "stringLiteralExpression";
    }
  }

  setValue(value: string | number | boolean) {
    const literalExpression: Expression = {
      type: this.getTypeLiteralType(value),
      value,
    };
    if (this.#expression === undefined) {
      this.#expression = literalExpression;
    } else if (isBinaryExpression(this.#expression)) {
      this.#expression.expressions.push(literalExpression);
    } else if (isCallExpression(this.#expression)) {
      // TODO this might not be correct if call arguments include nested expression(s)
      this.#expression.arguments.push(literalExpression);
    } else if (isConditionalExpression(this.#expression)) {
      const { condition, expressions } = this.#expression;
      if (condition.expressions.length < 2) {
        condition.expressions.push(literalExpression);
      } else if (expressions.length < 2) {
        expressions.push(literalExpression);
      }
    }
  }

  closeBrace() {
    this.#callStack.pop();
  }

  toJSON() {
    return this.#expression;
  }
}

export const walkTree = (tree: Tree, source: string) => {
  const columnExpression = new ColumnExpression();
  const cursor = tree.cursor();
  do {
    const { name, from, to } = cursor;

    switch (name) {
      case "Condition":
        columnExpression.setCondition();
        break;

      case "Column":
        {
          const columnName = source.substring(from, to);
          columnExpression.setColumn(columnName);
        }
        break;

      case "Function":
        {
          const functionName = source.substring(from, to);
          columnExpression.setFunction(functionName);
        }
        break;

      case "Times":
      case "Divide":
      case "Plus":
      case "Minus":
        {
          const op = source.substring(from, to);
          columnExpression.setOp(op);
        }
        break;

      case "BooleanOperator":
        {
          const op = source.substring(from, to);
          columnExpression.setBooleanOperator(op);
        }
        break;

      case "False":
      case "True":
        {
          const value = source.substring(from, to);
          columnExpression.setValue(value === "true" ? true : false);
        }
        break;

      case "String":
        columnExpression.setValue(source.substring(from + 1, to - 1));
        break;

      case "Number":
        columnExpression.setValue(parseFloat(source.substring(from, to)));
        break;

      case "CloseBrace":
        columnExpression.closeBrace();
        break;

      default:
    }
  } while (cursor.next());

  return columnExpression.toJSON();
};
